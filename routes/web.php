<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile (Breeze)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Tasks
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Payments (client pays for a task via PayPal)
    Route::post('/tasks/{task}/pay', [PaymentController::class, 'store'])->name('payments.store');
    // Payments (client declares a D17 transfer for a task)
    Route::post('/tasks/{task}/d17', [PaymentController::class, 'storeD17'])->name('payments.d17');

    // Chat
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/{user}/messages', [ChatController::class, 'fetch'])->name('chat.fetch');
    Route::post('/chat/{user}/messages', [ChatController::class, 'store'])->name('chat.store');

    // Payment tracking (freelancer only)
    Route::middleware('freelancer')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::patch('/payments/{payment}/review', [PaymentController::class, 'review'])->name('payments.review');
    });

    // CV management (freelancer only)
    Route::middleware('freelancer')->group(function () {
        Route::get('/cv', [CvController::class, 'edit'])->name('cv.edit');
        Route::patch('/cv/profile', [CvController::class, 'updateProfile'])->name('cv.profile');

        Route::post('/cv/diplomas', [CvController::class, 'storeDiploma'])->name('cv.diplomas.store');
        Route::patch('/cv/diplomas/{diploma}', [CvController::class, 'updateDiploma'])->name('cv.diplomas.update');
        Route::delete('/cv/diplomas/{diploma}', [CvController::class, 'destroyDiploma'])->name('cv.diplomas.destroy');

        Route::post('/cv/experiences', [CvController::class, 'storeExperience'])->name('cv.experiences.store');
        Route::patch('/cv/experiences/{experience}', [CvController::class, 'updateExperience'])->name('cv.experiences.update');
        Route::delete('/cv/experiences/{experience}', [CvController::class, 'destroyExperience'])->name('cv.experiences.destroy');

        Route::post('/cv/internships', [CvController::class, 'storeInternship'])->name('cv.internships.store');
        Route::patch('/cv/internships/{internship}', [CvController::class, 'updateInternship'])->name('cv.internships.update');
        Route::delete('/cv/internships/{internship}', [CvController::class, 'destroyInternship'])->name('cv.internships.destroy');

        // Projects
        Route::post('/cv/projects', [PortfolioController::class, 'storeProject'])->name('cv.projects.store');
        Route::post('/cv/projects/{project}', [PortfolioController::class, 'updateProject'])->name('cv.projects.update');
        Route::delete('/cv/projects/{project}', [PortfolioController::class, 'destroyProject'])->name('cv.projects.destroy');

        // Skills
        Route::post('/cv/skills', [PortfolioController::class, 'storeSkill'])->name('cv.skills.store');
        Route::patch('/cv/skills/{skill}', [PortfolioController::class, 'updateSkill'])->name('cv.skills.update');
        Route::delete('/cv/skills/{skill}', [PortfolioController::class, 'destroySkill'])->name('cv.skills.destroy');

        // Services
        Route::post('/cv/services', [PortfolioController::class, 'storeService'])->name('cv.services.store');
        Route::patch('/cv/services/{service}', [PortfolioController::class, 'updateService'])->name('cv.services.update');
        Route::delete('/cv/services/{service}', [PortfolioController::class, 'destroyService'])->name('cv.services.destroy');
    });
});

require __DIR__.'/auth.php';
