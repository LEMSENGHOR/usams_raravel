@props(['title', 'subtitle' => null])
<header class="ph-page-header">
    <div>
        <h1>{{ __($title) }}</h1>
        @if ($subtitle)
            <p class="ph-subtitle">{{ __($subtitle) }}</p>
        @endif
    </div>
    <div class="ph-actions">{{ $actions ?? '' }}</div>
</header>
