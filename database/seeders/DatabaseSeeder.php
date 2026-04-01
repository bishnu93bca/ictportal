<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Super admin
        User::factory()->create([
            'name'     => 'Super Admin',
            'email'    => 'superadmin@ictportal.com',
            'password' => Hash::make('Super@Password1'),
            'role'     => 'super_admin',
            'status'   => 'active',
        ]);

        // Admin
        User::factory()->create([
            'name'     => 'Dumka District Admin',
            'email'    => 'dumka.admin@ictportal.com',
            'password' => Hash::make('Password1'),
            'role'     => 'admin',
            'status'   => 'active',
            'district'  => 'Dumka',
            'state'     => 'Jharkhand',
            'country'   => 'India',
        ]);

        // District admin — Godda, Jharkhand
        User::factory()->create([
            'name'     => 'Godda District Admin',
            'email'    => 'dumka.admin@ictportal.com',
            'password' => Hash::make('Password1'),
            'role'     => 'admin',
            'status'   => 'active',
            'district'  => 'Godda',
            'state'     => 'Jharkhand',
            'country'   => 'India',
        ]);

        // Teacher — Godda, Jharkhand (login: UDISE code / password same as UDISE, like Dumka teachers)
        // User::updateOrCreate(
        //     ['udise_code' => '20130100101'],
        //     [
        //         'name'        => 'Sample Teacher Godda',
        //         'email'       => '20130100101@ictportal.local',
        //         'password'    => Hash::make('20130100101'),
        //         'role'        => 'teacher',
        //         'status'      => 'active',
        //         'school_name' => 'GOVT.M.S. SAMPLE GODDA',
        //         'district'    => 'Godda',
        //         'city'        => 'Godda',
        //         'state'       => 'Jharkhand',
        //         'country'     => 'India',
        //     ]
        // );

        // Sample users for each role
        // foreach (['manager', 'teacher', 'staff', 'student'] as $role) {
        //     User::factory()->count(3)->create(['role' => $role, 'status' => 'active']);
        // }

        $this->call(CategorySeeder::class);
        $this->call(RbacSeeder::class);
        $this->call(TeacherSeeder::class);
    }
}
