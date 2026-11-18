@props(['title', 'description' => null, 'icon' => null])
<div class="es-empty">
    @if ($icon)
        <i class="bi bi-{{ $icon }}" style="font-size:32px" aria-hidden="true"></i>
    @endif
    <h2>{{ __($title) }}</h2>
    @if ($description)
        <p>{{ __($description) }}</p>
    @endif
    <div class="es-slot">{{ $slot }}</div>
</div>
