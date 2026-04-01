<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List audit logs — super_admin only.
     * Supports filters: user_id, action, module, search (description/IP), date_from, date_to.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $query = AuditLog::with('user:id,name,email,role,avatar')
            ->latest();

        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($action = $request->string('action')->trim()->value()) {
            $query->where('action', strtoupper($action));
        }

        if ($module = $request->string('module')->trim()->value()) {
            $query->where('module', strtolower($module));
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        if ($from = $request->string('date_from')->trim()->value()) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->string('date_to')->trim()->value()) {
            $query->whereDate('created_at', '<=', $to);
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $logs    = $query->paginate($perPage);

        return response()->json($logs);
    }

    /** Show a single audit log entry. */
    public function show(Request $request, AuditLog $auditLog): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $auditLog->load('user:id,name,email,role,avatar');

        return response()->json(['data' => $auditLog]);
    }

    /**
     * Summary statistics — counts grouped by action / module for dashboard widgets.
     */
    public function stats(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $byAction = AuditLog::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->pluck('count', 'action');

        $byModule = AuditLog::selectRaw('module, COUNT(*) as count')
            ->groupBy('module')
            ->orderByDesc('count')
            ->limit(10)
            ->pluck('count', 'module');

        $recent7Days = AuditLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'by_action'    => $byAction,
            'by_module'    => $byModule,
            'recent_7days' => $recent7Days,
            'total'        => AuditLog::count(),
        ]);
    }
}
