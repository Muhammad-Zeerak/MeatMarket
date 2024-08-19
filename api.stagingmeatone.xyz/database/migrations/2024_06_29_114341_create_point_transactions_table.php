<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePointTransactionsTable extends Migration
{
    public function up()
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->integer('points');
            $table->string('type');
            $table->text('description')->nullable();
            $table->timestamp('transaction_date'); // Custom transaction date column
        });
    }

    public function down()
    {
        Schema::dropIfExists('point_transactions');
    }
}

