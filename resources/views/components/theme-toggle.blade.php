{{-- resources/js/modules/theme.js marks the active option and handles clicks. --}}
<div class="tt-toggle" role="radiogroup" aria-label="{{ __('Color theme') }}" data-theme-toggle>
    <button type="button" role="radio" class="tt-opt" data-theme-mode="light" aria-checked="false" aria-label="{{ __('Light theme') }}" title="{{ __('Light theme') }}"><i class="bi bi-sun" style="font-size:16px" aria-hidden="true"></i></button>
    <button type="button" role="radio" class="tt-opt" data-theme-mode="system" aria-checked="false" aria-label="{{ __('Match system theme') }}" title="{{ __('Match system theme') }}"><i class="bi bi-display" style="font-size:16px" aria-hidden="true"></i></button>
    <button type="button" role="radio" class="tt-opt" data-theme-mode="dark" aria-checked="false" aria-label="{{ __('Dark theme') }}" title="{{ __('Dark theme') }}"><i class="bi bi-moon" style="font-size:16px" aria-hidden="true"></i></button>
</div>
