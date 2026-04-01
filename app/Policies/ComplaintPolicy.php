<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Complaint;
use App\Models\User;

class ComplaintPolicy
{
    /** Admin/super_admin can see all complaints; others see only their own. */
    public function viewAny(User $authUser): bool
    {
        return true;
    }

    public function view(User $authUser, Complaint $complaint): bool
    {
        if ($authUser->id === $complaint->user_id) {
            return true;
        }

        if ($authUser->isAdmin()) {
            return $authUser->canManageComplaint($complaint);
        }

        return false;
    }

    /** Any authenticated user can file a complaint. */
    public function create(User $authUser): bool
    {
        return true;
    }

    /** Owner can edit while still pending; admins can always edit. */
    public function update(User $authUser, Complaint $complaint): bool
    {
        if ($authUser->isAdmin()) {
            return $authUser->canManageComplaint($complaint);
        }

        return $authUser->id === $complaint->user_id && $complaint->isPending();
    }

    /** Owner can soft-delete their own complaint; admins can too. */
    public function delete(User $authUser, Complaint $complaint): bool
    {
        if ($authUser->isAdmin()) {
            return $authUser->canManageComplaint($complaint);
        }

        return $authUser->id === $complaint->user_id;
    }

    /** Only admins can change the status of a complaint. */
    public function updateStatus(User $authUser, Complaint $complaint): bool
    {
        return $authUser->isAdmin() && $authUser->canManageComplaint($complaint);
    }

    public function restore(User $authUser, Complaint $complaint): bool
    {
        return $authUser->isAdmin() && $authUser->canManageComplaint($complaint);
    }

    public function forceDelete(User $authUser, Complaint $complaint): bool
    {
        return $authUser->isSuperAdmin();
    }
}
