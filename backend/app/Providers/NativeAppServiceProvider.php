<?php

namespace App\Providers;

use Native\Laravel\Facades\Window;
use Native\Laravel\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Log::info('NativePHP: Starting boot process');

        // 1. Create a System Tray Icon (MenuBar)
        // This ensures the app is visible even if the main window fails to open
        try {
            \Native\Laravel\Facades\MenuBar::create()
                ->label('Arvayon CRM')
                ->withContextMenu(
                    \Native\Laravel\Menus\Menu::new()
                        ->label('Arvayon CRM')
                        ->separator()
                        ->link('http://localhost:8111', 'Open Dashboard')
                        ->separator()
                        ->quit()
                );
            \Illuminate\Support\Facades\Log::info('NativePHP: MenuBar created');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('NativePHP: MenuBar failed: ' . $e->getMessage());
        }

        // 2. Wait for the Electron Bridge (Port 4000)
        // This prevents the "cURL error 7" during startup
        $maxAttempts = 15;
        $attempt = 0;
        $bridgeReady = false;

        while ($attempt < $maxAttempts && !$bridgeReady) {
            $connection = @fsockopen('localhost', 4000);
            if (is_resource($connection)) {
                fclose($connection);
                $bridgeReady = true;
                \Illuminate\Support\Facades\Log::info("NativePHP: Bridge ready on attempt {$attempt}");
            } else {
                sleep(1);
                $attempt++;
            }
        }

        // 3. Open the Main Window
        try {
            Window::open()
                ->width(1280)
                ->height(800)
                ->title('Arvayon CRM')
                ->rememberState()
                ->focused();

            \Illuminate\Support\Facades\Log::info('NativePHP: Window open request sent');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('NativePHP: Window failed: ' . $e->getMessage());
        }

        // 4. Database Setup
        try {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            if (\App\Models\User::count() === 0) {
                \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
            }
            \Illuminate\Support\Facades\Log::info('NativePHP: Database ready');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('NativePHP: DB error: ' . $e->getMessage());
        }
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
        ];
    }
}
