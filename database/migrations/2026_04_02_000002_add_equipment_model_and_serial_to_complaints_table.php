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
            $table->foreignId('equipment_model_id')
                ->nullable()
                ->after('sub_category_id')
                ->constrained('equipment_models')
                ->nullOnDelete();

            $table->string('serial_number', 255)->nullable()->after('equipment_model_id');
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropForeign(['equipment_model_id']);
            $table->dropColumn(['equipment_model_id', 'serial_number']);
        });
    }
};
