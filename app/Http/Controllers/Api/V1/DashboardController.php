<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $stats = Cache::remember(
            "dashboard_stats_{$authUser->role}_{$authUser->id}",
            now()->addMinutes(3),
            fn () => $this->buildStats($authUser)
        );

        return response()->json(['stats' => $stats]);
    }

    private function buildStats(User $user): array
    {
        $stats = [
            'my_profile' => [
                'name'          => $user->name,
                'role'          => $user->role,
                'last_login_at' => $user->last_login_at?->diffForHumans(),
                'member_since'  => $user->created_at->format('M Y'),
            ],
        ];

        // ── All roles see their own complaint summary ─────────────────────
        $stats['my_complaints'] = $this->myComplaintStats($user);

        // ── Admin / Super-admin ───────────────────────────────────────────
        if ($user->isAdmin()) {
            $stats = array_merge($stats, $this->adminStats($user));
        }

        // ── Manager also gets role breakdown ──────────────────────────────
        if ($user->hasRole('manager')) {
            $stats = array_merge($stats, $this->managerStats());
        }

        return $stats;
    }

    /* ────────────────────────────────────────────────────────────────────── */

    private function myComplaintStats(User $user): array
    {
        $base = Complaint::where('user_id', $user->id);

        return [
            'total'       => (clone $base)->count(),
            'pending'     => (clone $base)->where('status', 'pending')->count(),
            'under_review'=> (clone $base)->where('status', 'under_review')->count(),
            'resolved'    => (clone $base)->where('status', 'resolved')->count(),
            'rejected'    => (clone $base)->where('status', 'rejected')->count(),
        ];
    }

    private function adminStats(User $admin): array
    {
        $scopedUsers = User::query()->when(
            $admin->isDistrictScopedAdmin(),
            fn ($q) => $q->whereRaw('LOWER(TRIM(COALESCE(district, ""))) = ?', [
                mb_strtolower(trim((string) $admin->district)),
            ])
        );

        // ── User counts (district-scoped for district admins) ────────────
        $userStats = [
            'total_users'     => (clone $scopedUsers)->count(),
            'active_users'    => (clone $scopedUsers)->where('status', 'active')->count(),
            'inactive_users'  => (clone $scopedUsers)->where('status', 'inactive')->count(),
            'suspended_users' => (clone $scopedUsers)->where('status', 'suspended')->count(),
        ];

        // ── Users by role (for pie/bar) ──────────────────────────────────
        $usersByRole = (clone $scopedUsers)
            ->selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->map(fn ($v) => (int) $v);

        // ── User registrations last 6 months (area chart) ───────────────
        $monthlyRegistrations = $this->monthlyUserRegistrationsTrend($admin, 6);

        $complaintBase = Complaint::forDistrictAdmin($admin);

        // ── Complaint summary (for admin) ────────────────────────────────
        $complaintStats = [
            'total'        => (clone $complaintBase)->count(),
            'pending'      => (clone $complaintBase)->where('status', 'pending')->count(),
            'under_review' => (clone $complaintBase)->where('status', 'under_review')->count(),
            'resolved'     => (clone $complaintBase)->where('status', 'resolved')->count(),
            'rejected'     => (clone $complaintBase)->where('status', 'rejected')->count(),
        ];

        // ── Complaints by category (legacy string column; may be sparse) ─
        $complaintsByCategory = (clone $complaintBase)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->map(fn ($v) => (int) $v);

        // ── Complaints by status (donut) ─────────────────────────────────
        $complaintsByStatus = (clone $complaintBase)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($v) => (int) $v);

        // ── Monthly complaints last 6 months ─────────────────────────────
        $monthlyComplaints = $this->monthlyComplaintsTrend($admin, 6);

        // ── Recent registrations ─────────────────────────────────────────
        $recentRegistrations = (clone $scopedUsers)
            ->select(['id', 'name', 'email', 'role', 'avatar', 'created_at'])
            ->latest()
            ->limit(5)
            ->get();

        // ── Recent complaints ─────────────────────────────────────────────
        $recentComplaints = Complaint::forDistrictAdmin($admin)
            ->with('user:id,name,role,avatar')
            ->select(['id', 'user_id', 'title', 'category', 'status', 'created_at'])
            ->latest()
            ->limit(5)
            ->get();

        $merged = array_merge($userStats, [
            'users_by_role'           => $usersByRole,
            'monthly_registrations'   => $monthlyRegistrations,
            'complaint_stats'         => $complaintStats,
            'complaints_by_category'  => $complaintsByCategory,
            'complaints_by_status'    => $complaintsByStatus,
            'monthly_complaints'      => $monthlyComplaints,
            'recent_registrations'    => $recentRegistrations,
            'recent_complaints'       => $recentComplaints,
        ]);

        if ($admin->isDistrictScopedAdmin()) {
            $merged['district_scope'] = [
                'district' => $admin->district,
                'state'    => $admin->state,
            ];
        }

        return $merged;
    }

    /** User sign-ups per month (optionally limited to district). */
    private function monthlyUserRegistrationsTrend(User $admin, int $months): array
    {
        $q = DB::table('users')
            ->where('created_at', '>=', now()->subMonths($months)->startOfMonth())
            ->whereNull('deleted_at');

        if ($admin->isDistrictScopedAdmin()) {
            $q->whereRaw('LOWER(TRIM(COALESCE(district, ""))) = ?', [
                mb_strtolower(trim((string) $admin->district)),
            ]);
        }

        $rows = $q
            ->selectRaw("DATE_FORMAT(created_at, '%b %y') as month,
                         YEAR(created_at) as yr,
                         MONTH(created_at) as mo,
                         COUNT(*) as count")
            ->groupByRaw("DATE_FORMAT(created_at, '%b %y'), YEAR(created_at), MONTH(created_at)")
            ->orderByRaw('yr, mo')
            ->get();

        return $rows->map(fn ($r) => [
            'month' => $r->month,
            'count' => (int) $r->count,
        ])->values()->toArray();
    }

    /** Complaints filed per month (scoped to district admin when applicable). */
    private function monthlyComplaintsTrend(User $admin, int $months): array
    {
        $q = Complaint::forDistrictAdmin($admin)
            ->where('created_at', '>=', now()->subMonths($months)->startOfMonth());

        $rows = $q
            ->selectRaw("DATE_FORMAT(created_at, '%b %y') as month,
                         YEAR(created_at) as yr,
                         MONTH(created_at) as mo,
                         COUNT(*) as count")
            ->groupByRaw("DATE_FORMAT(created_at, '%b %y'), YEAR(created_at), MONTH(created_at)")
            ->orderByRaw('yr, mo')
            ->get();

        return $rows->map(fn ($r) => [
            'month' => $r->month,
            'count' => (int) $r->count,
        ])->values()->toArray();
    }

    private function managerStats(): array
    {
        return [
            'staff_count'   => User::where('role', 'staff')->count(),
            'teacher_count' => User::where('role', 'teacher')->count(),
            'student_count' => User::where('role', 'student')->count(),
            'parent_count'  => User::where('role', 'parent')->count(),
        ];
    }

    /**
     * Returns the last $months months as chart-ready data:
     * [{ month: 'Nov 24', count: 12 }, ...]
     */
    private function monthlyTrend(string $table, string $dateColumn, int $months): array
    {
        $rows = DB::table($table)
            ->selectRaw("DATE_FORMAT({$dateColumn}, '%b %y') as month,
                         YEAR({$dateColumn}) as yr,
                         MONTH({$dateColumn}) as mo,
                         COUNT(*) as count")
            ->where($dateColumn, '>=', now()->subMonths($months)->startOfMonth())
            ->whereNull('deleted_at')
            ->groupByRaw("DATE_FORMAT({$dateColumn}, '%b %y'), YEAR({$dateColumn}), MONTH({$dateColumn})")
            ->orderByRaw('yr, mo')
            ->get();

        return $rows->map(fn ($r) => [
            'month' => $r->month,
            'count' => (int) $r->count,
        ])->values()->toArray();
    }
}
