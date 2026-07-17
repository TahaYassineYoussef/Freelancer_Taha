<?php

namespace App\Rules;

use App\Support\AiModerator;
use App\Support\ContentModerator;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects text containing profanity, insults, scams or spam.
 *
 * Two layers:
 *  1. ContentModerator — a local word/pattern list. Free, instant, always runs.
 *  2. AiModerator — Claude. Catches what the list misses (new slang, disguised
 *     insults, creative scams) with no list to maintain. Skipped when no API key
 *     is configured, and never blocks a submission if the API is unreachable.
 */
class CleanText implements ValidationRule
{
    public function __construct(private string $context = 'user submitted text')
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        // --- Layer 1: local list (free, catches the obvious cases instantly) ---
        if (ContentModerator::findProfanity($value)) {
            $fail('Please keep it professional — offensive language is not allowed.');

            return;
        }

        if ($reason = ContentModerator::findScam($value)) {
            $fail("This looks like spam or a scam ({$reason}). Please rewrite it.");

            return;
        }

        // --- Layer 2: AI (catches what the list cannot) ---
        $verdict = AiModerator::check($value, $this->context);

        if ($verdict !== null && $verdict['allowed'] === false) {
            $fail($verdict['reason'] !== ''
                ? $verdict['reason']
                : 'This content was flagged as inappropriate. Please rewrite it.');
        }
    }
}
