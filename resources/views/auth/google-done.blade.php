<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $heading }}</title>
    <style>
        :root { color-scheme: dark; }
        body {
            margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #0B0B0D; color: #fff; padding: 24px;
            font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        .card {
            max-width: 420px; width: 100%; text-align: center;
            background: #1B1B1F; border: 1px solid rgba(255,255,255,.06);
            border-radius: 20px; padding: 34px 26px;
        }
        .mark { font-size: 44px; line-height: 1; }
        h1 { font-size: 20px; margin: 14px 0 8px; font-weight: 800; }
        p { margin: 0; color: #9AA0A6; font-size: 14px; line-height: 1.6; }
        .hint { margin-top: 18px; font-size: 12px; color: #6b7075; }
        .gold { color: #F9B233; }
    </style>
</head>
<body>
    <div class="card">
        <div class="mark">{{ $ok ? '✅' : '⚠️' }}</div>
        <h1>{{ $heading }}</h1>
        <p>{{ $body }}</p>
        @if ($ok)
            <p class="hint">
                In the <span class="gold">Android / iOS</span> app this step is invisible — the app captures
                it automatically and returns you to where you were. This page only appears in a plain
                browser, which cannot hand the result back to the app.
            </p>
        @endif
    </div>
</body>
</html>
