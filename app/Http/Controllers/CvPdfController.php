<?php

namespace App\Http\Controllers;

use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CvPdfController extends Controller
{
    /**
     * Generate Taha's CV as a downloadable PDF from his live profile data.
     */
    public function download(): Response
    {
        $freelancer = User::where('role', 'freelancer')
            ->with([
                'diplomas' => fn ($q) => $q->orderByDesc('end_year'),
                'experiences' => fn ($q) => $q->orderByDesc('is_current')->orderByDesc('start_date'),
                'internships' => fn ($q) => $q->orderByDesc('start_date'),
                'skills' => fn ($q) => $q->orderByDesc('level'),
                'projects' => fn ($q) => $q->latest(),
            ])
            ->firstOrFail();

        $pdf = Pdf::loadView('pdf.cv', ['f' => $freelancer])->setPaper('a4');

        $filename = Str::slug($freelancer->name ?: 'cv').'-cv.pdf';

        return $pdf->download($filename);
    }
}
