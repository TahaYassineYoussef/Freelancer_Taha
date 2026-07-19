<?php

namespace Database\Seeders;

use App\Models\Diploma;
use App\Models\Experience;
use App\Models\Internship;
use App\Models\Message;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // The freelancer (site owner / admin) — the ONLY freelancer account.
        // Keyed on the real email so seeding always targets this one account and
        // can never create a second freelancer. The password is only set when the
        // account is first created, so re-seeding never resets a live password.
        $taha = User::firstOrNew(['email' => 'yassineyoussef248@gmail.com']);
        $taha->fill([
            'name' => 'Taha Yassine Youssef',
            'role' => 'freelancer',
            'headline' => 'Full-Stack Developer & Software Engineer',
            'bio' => 'I am Taha Yassine Youssef, a passionate full-stack developer specialising in '
                .'building modern web applications with Laravel, React and clean, scalable architecture. '
                .'I help startups and businesses turn ideas into polished digital products.',
            'location' => 'Sousse, Tunisia',
            'phone' => '27617930',
            'email_verified_at' => now(),
        ]);
        if (! $taha->exists) {
            $taha->password = Hash::make('password');
        }
        $taha->save();

        // Safety net: demote any other freelancer that somehow exists, so there
        // is never more than one admin.
        User::where('role', 'freelancer')->where('id', '!=', $taha->id)->update(['role' => 'client']);

        $taha->diplomas()->delete();
        $taha->experiences()->delete();
        $taha->internships()->delete();

        $taha->diplomas()->createMany([
            [
                'title' => 'Master of Science in Software Engineering',
                'institution' => 'National School of Applied Sciences (ENSA)',
                'field' => 'Software Engineering',
                'start_year' => 2020,
                'end_year' => 2022,
                'description' => 'Graduated with honours. Specialised in distributed systems and web technologies.',
            ],
            [
                'title' => 'Bachelor of Science in Computer Science',
                'institution' => 'Faculty of Sciences',
                'field' => 'Computer Science',
                'start_year' => 2017,
                'end_year' => 2020,
                'description' => 'Fundamentals of algorithms, databases, and software development.',
            ],
        ]);

        $taha->experiences()->createMany([
            [
                'company' => 'TechNova Solutions',
                'position' => 'Senior Full-Stack Developer',
                'location' => 'Remote',
                'start_date' => '2023-01-01',
                'end_date' => null,
                'is_current' => true,
                'description' => 'Leading development of SaaS products using Laravel and React. '
                    .'Mentoring junior developers and designing scalable APIs.',
            ],
            [
                'company' => 'Digital Craft Agency',
                'position' => 'Web Developer',
                'location' => 'Casablanca, Morocco',
                'start_date' => '2022-02-01',
                'end_date' => '2022-12-31',
                'is_current' => false,
                'description' => 'Built custom client websites and e-commerce platforms.',
            ],
        ]);

        $taha->internships()->createMany([
            [
                'company' => 'InnovX Labs',
                'position' => 'Software Engineering Intern',
                'location' => 'Rabat, Morocco',
                'start_date' => '2021-06-01',
                'end_date' => '2021-09-30',
                'description' => 'Developed internal tooling and contributed to a customer portal built with Laravel.',
            ],
            [
                'company' => 'StartupHub',
                'position' => 'Frontend Intern',
                'location' => 'Casablanca, Morocco',
                'start_date' => '2020-07-01',
                'end_date' => '2020-09-30',
                'description' => 'Built responsive UI components with React and improved accessibility.',
            ],
        ]);

        // A demo client account
        $client = User::updateOrCreate(
            ['email' => 'client@freelancer.test'],
            [
                'name' => 'Sarah Client',
                'password' => Hash::make('password'),
                'role' => 'client',
                'email_verified_at' => now(),
            ]
        );

        // A sample task posted by the client for Taha
        Task::updateOrCreate(
            ['user_id' => $client->id, 'title' => 'Build a company landing page'],
            [
                'description' => 'I need a modern, responsive landing page for my startup with a contact form.',
                'category' => 'Web Development',
                'budget' => 500.00,
                'deadline' => now()->addWeeks(2)->toDateString(),
                'status' => 'open',
            ]
        );

        // A sample conversation between the client and Taha
        Message::firstOrCreate(
            ['sender_id' => $client->id, 'receiver_id' => $taha->id, 'body' => 'Hi Taha, are you available for a new project?'],
        );
        Message::firstOrCreate(
            ['sender_id' => $taha->id, 'receiver_id' => $client->id, 'body' => 'Hello Sarah! Yes, I would be happy to help. Tell me more about it.'],
        );
    }
}
