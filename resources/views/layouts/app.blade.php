@php
    $apiBase = parse_url(url('/api'), PHP_URL_PATH) ?: '/api';
    $basePath = rtrim(parse_url(url('/'), PHP_URL_PATH) ?: '', '/');
    $usamsConfig = [
        'apiBase' => $apiBase,
        'base' => $basePath,
        'area' => $area ?? 'guest',
        'page' => $page ?? '',
        'resource' => $resource ?? null,
    ];
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ isset($title) ? __($title).' | USAMS' : 'USAMS' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap" rel="stylesheet">
    {{-- Apply the saved theme before first paint so dark mode does not flash white. --}}
    <script>
        (function () {
            try {
                var m = localStorage.getItem('usams_theme') || 'system';
                var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.dataset.theme = dark ? 'dark' : 'light';
            } catch (e) {}
        })();
    </script>
    <script id="usams-config" type="application/json">
        {!! json_encode($usamsConfig, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
    </script>
    <script>
        window.USAMS = JSON.parse(document.getElementById('usams-config').textContent);
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="is-booting" data-area="{{ $area ?? 'guest' }}" data-page="{{ $page ?? '' }}">
    <noscript>{{ __('JavaScript is required to use USAMS.') }}</noscript>
    @yield('body')
    <div class="tc-toasts" id="toasts" aria-live="polite"></div>
</body>
</html>
