<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Category CRUD is enforced by role (admin / super_admin) in FormRequests, not RBAC slugs.
     */
    public function up(): void
    {
        $ids = DB::table('permissions')
            ->where('slug', 'like', 'categories.%')
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        DB::table('role_permissions')->whereIn('permission_id', $ids)->delete();
        DB::table('permissions')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        // Restored by re-running RbacSeeder if categories permissions are re-added to the catalogue.
    }
};
