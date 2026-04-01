<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Who performed the action (nullable for system/unauthenticated actions)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // What action was performed
            $table->enum('action', ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']);

            // Which module/resource was affected
            $table->string('module', 100);

            // Human-readable description
            $table->string('description');

            // State snapshots (nullable for CREATE and DELETE where only one is relevant)
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();

            // Request context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            // Timestamp only — no updated_at needed for audit records
            $table->timestamp('created_at')->useCurrent();

            // Indexes for fast filtering
            $table->index('user_id');
            $table->index('action');
            $table->index('module');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
