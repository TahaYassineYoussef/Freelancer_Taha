<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Returning to the app…</title>
    <style>
        :root { color-scheme: dark; }
        body {
            margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #0B0B0D; color: #fff; padding: 24px;
            font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        .card {
            max-width: 400px; width: 100%; text-align: center;
            background: #1B1B1F; border: 1px solid rgba(255,255,255,.06);
            border-radius: 20px; padding: 32px 26px;
        }
        .mark { font-size: 40px; line-height: 1; }
        h1 { font-size: 19px; margin: 14px 0 8px; font-weight: 800; }
        p { margin: 0; color: #9AA0A6; font-size: 14px; line-height: 1.6; }
        a.btn {
            display: inline-block; margin-top: 20px; padding: 13px 26px;
            background: #F9B233; color: #0B0B0D; font-weight: 800;
            border-radius: 999px; text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="mark">{{ $ok ? '✅' : '⚠️' }}</div>
        <h1>{{ $ok ? 'Signed in' : 'Sign-in failed' }}</h1>
        <p>
            {{ $ok
                ? 'Taking you back to the app…'
                : 'We could not complete Google sign-in. Close this tab and try again.' }}
        </p>

        {{-- Browsers block a server 302 to a custom scheme, so the jump is made
             from the page instead, with a tappable link as the fallback. --}}
        <a class="btn" id="back" href="{{ $deepLink }}">Open the app</a>
    </div>

    <script>
        // Try immediately; the button stays for browsers that need a real tap.
        window.location.replace(@json($deepLink));
    </script>
</body>
</html>
