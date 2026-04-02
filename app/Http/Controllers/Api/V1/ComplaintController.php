<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Complaint\StoreComplaintRequest;
use App\Http\Requests\Complaint\UpdateComplaintRequest;
use App\Http\Requests\Complaint\UpdateComplaintStatusRequest;
use App\Http\Traits\LogsActivity;
use App\Models\Complaint;
use App\Models\ComplaintAttachment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class ComplaintController extends Controller
{
    use LogsActivity;

    private const EAGER = [
        'user:id,name,email,role,avatar,district,phone,address,state,school_name,udise_code',
        'resolver:id,name',
        'attachments',
        'category:id,name,slug',
        'subCategory:id,name,slug,category_id',
        'equipmentModel:id,name,slug,sub_category_id',
    ];

    /**
     * Admin/super_admin see all complaints; others see only their own.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $query = Complaint::with(self::EAGER);

        if (! $authUser->isAdmin()) {
            $query->where('user_id', $authUser->id);
        } else {
            $query->forDistrictAdmin($authUser);
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('status', $status);
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($subCategoryId = $request->integer('sub_category_id')) {
            $query->where('sub_category_id', $subCategoryId);
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $complaints = $query->latest()->paginate((int) $request->input('per_page', 15));

        $this->attachDistrictAdmins($complaints->getCollection());

        return response()->json($complaints);
    }

    public function store(StoreComplaintRequest $request): JsonResponse
    {
        $this->authorize('create', Complaint::class);

        $complaint = Complaint::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        // Handle file uploads
        if ($request->hasFile('attachments')) {
            $this->storeFiles($complaint, $request->file('attachments'));
        }

        $complaint->load(self::EAGER);
        $this->attachDistrictAdmins(collect([$complaint]));

        $this->logCreate('complaints', "Complaint #{$complaint->id} created: \"{$complaint->title}\"",
            $complaint->toArray());

        return response()->json([
            'message' => 'Complaint submitted successfully.',
            'complaint' => $complaint,
        ], 201);
    }

    public function show(Complaint $complaint): JsonResponse
    {
        $this->authorize('view', $complaint);

        $complaint->load(self::EAGER);

        $districtAdmin = User::districtAdminPayload($complaint->user?->district);
        $complaint->setAttribute('district_admin', $districtAdmin);

        return response()->json([
            'complaint' => $complaint,
            'district_coordinator' => [
                'name' => config('ictportal.district_coordinator_name'),
                'phone' => config('ictportal.district_coordinator_phone'),
            ],
        ]);
    }

    public function update(UpdateComplaintRequest $request, Complaint $complaint): JsonResponse
    {
        $this->authorize('update', $complaint);

        $before = $complaint->toArray();
        $complaint->update($request->validated());

        $this->logUpdate('complaints', "Complaint #{$complaint->id} updated: \"{$complaint->title}\"",
            $before, $complaint->fresh()->toArray());

        return response()->json([
            'message' => 'Complaint updated successfully.',
            'complaint' => $complaint->fresh(self::EAGER),
        ]);
    }

    /**
     * Upload additional attachments — owner (pending) or admin.
     */
    public function storeAttachment(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorize('update', $complaint);

        $request->validate([
            'attachments' => ['required', 'array', 'min:1', 'max:5'],
            'attachments.*' => [
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip',
            ],
        ]);

        $uploaded = $this->storeFiles($complaint, $request->file('attachments'));

        return response()->json([
            'message' => 'Attachments uploaded.',
            'attachments' => $uploaded,
        ], 201);
    }

    /**
     * Delete a single attachment — owner or admin.
     */
    public function destroyAttachment(Request $request, Complaint $complaint, ComplaintAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $complaint);

        abort_if($attachment->complaint_id !== $complaint->id, 404);

        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted.']);
    }

    /**
     * Update status and admin note — restricted to admin/super_admin.
     */
    public function updateStatus(UpdateComplaintStatusRequest $request, Complaint $complaint): JsonResponse
    {
        $this->authorize('updateStatus', $complaint);

        $before = $complaint->only(['status', 'admin_note']);
        $complaint->update([
            'status' => $request->status,
            'admin_note' => $request->admin_note,
            'resolved_by' => $request->user()->id,
        ]);

        $this->logUpdate('complaints',
            "Complaint #{$complaint->id} status changed: {$before['status']} → {$request->status}",
            $before,
            $complaint->fresh()->only(['status', 'admin_note', 'resolved_by']));

        return response()->json([
            'message' => 'Complaint status updated.',
            'complaint' => $complaint->fresh(self::EAGER),
        ]);
    }

    public function destroy(Request $request, Complaint $complaint): JsonResponse
    {
        $this->authorize('delete', $complaint);

        $before = $complaint->toArray();

        // Remove all physical files before soft-deleting
        foreach ($complaint->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $complaint->delete();

        $this->logDelete('complaints', "Complaint #{$complaint->id} deleted: \"{$complaint->title}\"", $before);

        return response()->json(['message' => 'Complaint deleted.']);
    }

    /**
     * Persist uploaded files and create ComplaintAttachment records.
     *
     * @param  UploadedFile[]  $files
     * @return ComplaintAttachment[]
     */
    private function attachDistrictAdmins(Collection $complaints): void
    {
        $cache = [];

        foreach ($complaints as $complaint) {
            $d = $complaint->user?->district;

            if ($d === null || trim((string) $d) === '') {
                $complaint->setAttribute('district_admin', null);

                continue;
            }

            $key = mb_strtolower(trim((string) $d));

            if (! array_key_exists($key, $cache)) {
                $cache[$key] = User::districtAdminPayload($d);
            }

            $complaint->setAttribute('district_admin', $cache[$key]);
        }
    }

    private function storeFiles(Complaint $complaint, array $files): array
    {
        $saved = [];

        foreach ($files as $file) {
            $path = $file->store("complaints/{$complaint->id}", 'public');

            $saved[] = ComplaintAttachment::create([
                'complaint_id' => $complaint->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            ]);
        }

        return $saved;
    }
}
