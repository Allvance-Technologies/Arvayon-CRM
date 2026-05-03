<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // \App\Models\User::factory(10)->create();

        \App\Models\User::updateOrCreate(
            ['email' => 'admin@arvayon.com'],
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'role' => 'Admin',
                'password' => bcrypt('admin123'),
                'is_active' => true,
            ]
        );
    }
}
