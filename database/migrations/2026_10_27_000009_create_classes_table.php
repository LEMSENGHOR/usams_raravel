<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('classes')) return;

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('major_id')->constrained('majors')->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->timestamps();

            $table->unique(['major_id', 'academic_year_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
