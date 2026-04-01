<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->hasRole('manager');
    }

    public function view(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return true;
        }

        if ($authUser->hasRole('manager') && ! $authUser->isAdmin()) {
            return true;
        }

        if ($authUser->isAdmin()) {
            return $authUser->canAccessUserInManagementScope($user);
        }

        return false;
    }

    public function create(User $authUser): bool
    {
        return $authUser->isSuperAdmin();
    }

    public function update(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return true;
        }

        if ($authUser->isAdmin()) {
            return $authUser->canAccessUserInManagementScope($user);
        }

        return false;
    }

    public function delete(User $authUser, User $user): bool
    {
        return $authUser->isSuperAdmin();
    }

    public function restore(User $authUser, User $user): bool
    {
        return $authUser->isSuperAdmin();
    }

    public function forceDelete(User $authUser, User $user): bool
    {
        return $authUser->isSuperAdmin();
    }
}
