@props(['label', 'icon' => null, 'stat' => null, 'hint' => null])
{{-- The value is filled by JavaScript (data-value). It shows a dash until the API returns a real number. --}}
<div class="card sc-stat" @if ($stat) data-stat="{{ $stat }}" @endif>
    <div class="sc-top">
        <span class="sc-label">{{ __($label) }}</span>
        @if ($icon)
            <i class="bi bi-{{ $icon }} sc-icon" style="font-size:18px" aria-hidden="true"></i>
        @endif
    </div>
    <div class="sc-skeleton" data-skeleton aria-label="{{ __('Loading') }}"></div>
    <div class="sc-value" data-value hidden>—</div>
    @if ($hint)
        <p class="sc-hint">{{ __($hint) }}</p>
    @endif
</div>
