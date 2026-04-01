<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * District-scoped admins need `district` set or the API shows all users (including other districts).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'district')) {
            return;
        }

        DB::table('users')
            ->where('email', 'admin@ictportal.local')
            ->where(function ($q) {
                $q->whereNull('district')->orWhere('district', '');
            })
            ->update([
                'district' => 'Dumka',
                'state'    => 'Jharkhand',
                'country'  => 'India',
            ]);
    }

    public function down(): void
    {
        // Non-reversible data fix
    }
};
