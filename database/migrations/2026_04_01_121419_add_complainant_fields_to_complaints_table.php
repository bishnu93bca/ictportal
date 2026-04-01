<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->string('complainant_name')->after('user_id');
            $table->string('school_name')->after('complainant_name');
            $table->string('udise_code')->after('school_name');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropColumn(['complainant_name', 'school_name', 'udise_code']);
        });
    }
};
