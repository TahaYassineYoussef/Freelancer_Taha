<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Lightweight content moderation used on user-submitted text
 * (posted tasks and testimonials).
 */
class ContentModerator
{
    /**
     * Profanity/insults — English, French and common Tunisian/Arabic transliterations.
     * Matched on a normalised copy of the text (accents stripped, leetspeak folded).
     */
    private const PROFANITY = [
        // English
        'fuck', 'fucker', 'fucking', 'shit', 'bullshit', 'bitch', 'bastard', 'asshole',
        'dickhead', 'motherfucker', 'cunt', 'slut', 'whore', 'retard', 'faggot', 'nigger',
        'wanker', 'prick', 'douchebag', 'jackass',
        // French
        'merde', 'putain', 'salope', 'connard', 'connasse', 'enculé', 'encule', 'batard',
        'pute', 'nique', 'niquer', 'ta gueule', 'fils de pute', 'bordel',
        // Arabic / Tunisian transliteration
        'zebi', 'kahba', 'sharmouta', 'charmouta', 'nik', 'nikomok', 'kess', 'kess omek',
        'yalahwi', 'hmar', '7mar', 'kelb', 'malak',
    ];

    /**
     * Signals commonly used by scammers / spam.
     */
    private const SCAM_PATTERNS = [
        '/\b(bitcoin|btc|ethereum|usdt|crypto\s*wallet|binance)\b/i',
        '/\b(western\s*union|money\s*gram|moneygram|wire\s*transfer)\b/i',
        '/\b(gift\s*card|itunes\s*card|steam\s*card)\b/i',
        '/\b(investment\s*(opportunity|plan)|double\s*your\s*money|guaranteed\s*profit)\b/i',
        '/\b(nigerian\s*prince|inheritance\s*fund|lottery\s*winner|you\s*have\s*won)\b/i',
        '/\b(send\s*(me\s*)?(your\s*)?(password|otp|verification\s*code|card\s*number|cvv))\b/i',
        '/\b(0x[a-f0-9]{40})\b/i',                       // ETH wallet
        '/\b([13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/',       // BTC wallet
    ];

    /**
     * Returns the first profanity found, or null when the text is clean.
     */
    public static function findProfanity(?string $text): ?string
    {
        if (blank($text)) {
            return null;
        }

        $normalised = self::normalise($text);

        foreach (self::PROFANITY as $word) {
            $pattern = '/(?<![a-z])'.preg_quote(self::normalise($word), '/').'(?![a-z])/i';
            if (preg_match($pattern, $normalised)) {
                return $word;
            }
        }

        return null;
    }

    /**
     * Returns a reason when the text looks like a scam, otherwise null.
     */
    public static function findScam(?string $text): ?string
    {
        if (blank($text)) {
            return null;
        }

        foreach (self::SCAM_PATTERNS as $pattern) {
            if (preg_match($pattern, $text)) {
                return 'suspicious content';
            }
        }

        // A wall of links is almost always spam.
        if (preg_match_all('#https?://#i', $text) > 2) {
            return 'too many links';
        }

        return null;
    }

    /**
     * Lowercase, strip accents and fold common leetspeak so "5h!t" == "shit".
     */
    private static function normalise(string $text): string
    {
        $text = Str::lower(Str::ascii($text));

        $text = strtr($text, [
            '0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a',
            '5' => 's', '7' => 'h', '8' => 'b', '@' => 'a',
            '$' => 's', '!' => 'i', '|' => 'i', '*' => '',
        ]);

        // Collapse repeated letters ("shiiiit" -> "shit") and stray separators.
        $text = preg_replace('/(.)\1{2,}/', '$1', $text);
        $text = preg_replace('/[._\-]+/', '', $text);

        return $text;
    }
}
