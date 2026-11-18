<?php
namespace Database\Seeders;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;


class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'adminsenghor@gmail.com';

        // Do not overwrite an existing user's password.
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->command->warn(
                "User {$email} already exists. Nothing changed."
            );

            return;
        }

        $user = new User();

        $user->name = 'Super Admin';
        $user->email = $email;
        $user->password = Hash::make('12345');
        $user->role = User::ROLE_SUPER_ADMIN;
        $user->status = User::STATUS_ACTIVE;

        $user->save();

        $this->command->info(
            "Super Admin created successfully: {$email}"
        );
    }
}
