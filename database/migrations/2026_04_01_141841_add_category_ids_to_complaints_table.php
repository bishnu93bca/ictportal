<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            // New FK columns — nullable to keep existing rows valid
            $table->foreignId('category_id')
                  ->nullable()
                  ->after('udise_code')
                  ->constrained('categories')
                  ->nullOnDelete();

            $table->foreignId('sub_category_id')
                  ->nullable()
                  ->after('category_id')
                  ->constrained('sub_categories')
                  ->nullOnDelete();

            // Old string column stays but becomes nullable
            $table->string('category')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['sub_category_id']);
            $table->dropColumn(['category_id', 'sub_category_id']);
            $table->string('category')->default('other')->change();
        });
    }
};
