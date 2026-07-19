<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\FreelancerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PortfolioController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/portfolio', [PortfolioController::class, 'index']);
Route::get('/translations/{locale}', [ClientController::class, 'translations']);
Route::post('/contact', [ClientController::class, 'contact'])->middleware('throttle:5,1');

// Authenticated (Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile
    Route::patch('/profile', [ClientController::class, 'updateProfile']);
    Route::put('/profile/password', [ClientController::class, 'updatePassword']);

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('throttle:10,60');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    // Task actions — client
    Route::post('/tasks/{task}/approve', [TaskController::class, 'approve']);
    Route::post('/tasks/{task}/request-changes', [TaskController::class, 'requestChanges']);

    // Task actions — freelancer
    Route::post('/tasks/{task}/accept', [TaskController::class, 'accept']);
    Route::post('/tasks/{task}/decline', [TaskController::class, 'decline']);
    Route::post('/tasks/{task}/deliver', [TaskController::class, 'deliver']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus']);

    // Payments
    Route::get('/payments/config', [PaymentController::class, 'config']);
    Route::post('/tasks/{task}/pay', [PaymentController::class, 'paypal']);
    Route::post('/tasks/{task}/d17', [PaymentController::class, 'd17']);

    // Deliveries
    Route::get('/deliveries', [ClientController::class, 'deliveries']);

    // Freelancer console
    Route::get('/freelancer/dashboard', [FreelancerController::class, 'dashboard']);
    Route::get('/freelancer/payments', [FreelancerController::class, 'payments']);
    Route::patch('/freelancer/payments/{payment}', [FreelancerController::class, 'reviewPayment']);
    Route::get('/freelancer/revisions', [FreelancerController::class, 'revisions']);
    Route::get('/freelancer/reviews', [FreelancerController::class, 'reviews']);
    Route::patch('/freelancer/reviews/{testimonial}', [FreelancerController::class, 'moderateReview']);

    // Admin console: visitors, bookings, availability, inbox, blocked, CV
    Route::get('/admin/visitors', [AdminController::class, 'visitors']);
    Route::get('/admin/bookings', [AdminController::class, 'bookings']);
    Route::patch('/admin/bookings/{booking}', [AdminController::class, 'reviewBooking']);
    Route::get('/admin/availability', [AdminController::class, 'availability']);
    Route::patch('/admin/availability', [AdminController::class, 'updateAvailability']);
    Route::get('/admin/inbox', [AdminController::class, 'inbox']);
    Route::patch('/admin/inbox/{message}/read', [AdminController::class, 'readMessage']);
    Route::delete('/admin/inbox/{message}', [AdminController::class, 'destroyMessage']);
    Route::get('/admin/blocked', [AdminController::class, 'blocked']);
    Route::delete('/admin/blocked/{log}', [AdminController::class, 'destroyBlocked']);
    Route::get('/admin/payment-settings', [AdminController::class, 'paymentSettings']);
    Route::patch('/admin/payment-settings', [AdminController::class, 'updatePaymentSettings']);
    Route::get('/admin/cv', [AdminController::class, 'cv']);
    Route::patch('/admin/cv/profile', [AdminController::class, 'updateCvProfile']);

    // Reviews
    Route::post('/testimonials', [ClientController::class, 'storeTestimonial'])->middleware('throttle:5,60');

    // Notifications
    Route::get('/notifications', [ClientController::class, 'notifications']);
    Route::post('/notifications/read', [ClientController::class, 'readAllNotifications']);
    Route::post('/notifications/{id}/read', [ClientController::class, 'readNotification']);

    // Calls (WebRTC signalling, same contract as the web client)
    Route::get('/calls/poll', [CallController::class, 'poll']);
    Route::post('/calls/signal', [CallController::class, 'signal']);
    Route::post('/calls/log', [CallController::class, 'log']);
    Route::post('/devices', [CallController::class, 'registerDevice']);
    Route::delete('/devices', [CallController::class, 'forgetDevice']);

    // Chat
    Route::get('/chat/partners', [ChatController::class, 'partners']);
    Route::get('/chat/{user}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/{user}/messages', [ChatController::class, 'send']);
});
