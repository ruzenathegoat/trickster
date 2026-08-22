<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Visiting the backend login URL directly should open the React page instead
// of falling through to the POST-only session endpoint.
Route::get('/login', function () {
    return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/login');
})->name('login.page');

Route::get('/register', function () {
    return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/register');
})->name('register.page');

Route::get('/admin/login', function () {
    return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/admin/login');
})->name('admin.login.page');

require __DIR__.'/auth.php';
