<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('docs/features/dumka_full_data.json');
        $schools  = json_decode(file_get_contents($jsonPath), true);

        foreach ($schools as $school) {
            $udise = (string) $school['UDISE CODE'];
            $email = $udise . '@ictportal.local';

            // Skip if UDISE already exists
            if (User::withTrashed()->where('udise_code', $udise)->exists()) {
                continue;
            }

            // Normalize phone: keep only digits, max 10
            $rawPhone = preg_replace('/\D+/', '', (string) ($school['HM  Contact No.'] ?? ''));
            $phone    = strlen($rawPhone) >= 10 ? substr($rawPhone, -10) : null;

            User::create([
                'name'        => trim((string) ($school['Name Of Head Master'] ?? 'Unknown')),
                'email'       => $email,
                'password'    => Hash::make($udise),   // initial password = UDISE code
                'role'        => 'teacher',
                'status'      => 'active',
                'udise_code'  => $udise,
                'school_name' => trim((string) ($school['SCHOOL NAME'] ?? '')),
                'phone'       => $phone,
                'address'     => trim((string) ($school['ADDRESS'] ?? '')),
                'city'        => trim((string) ($school['BLOCK / (M)'] ?? '')),   // block
                'district'    => strtoupper(trim((string) ($school['DISTRICT'] ?? ''))),
                'state'       => 'Jharkhand',
                'country'     => 'India',
                'postal_code' => (string) ($school['Pin Code'] ?? ''),
            ]);
        }

        $this->command->info('TeacherSeeder: ' . count($schools) . ' teachers processed.');
    }
}
