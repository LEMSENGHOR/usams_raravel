@php
    $homeIsCurrent = request()->is(trim($homePath, '/'));
@endphp
<nav aria-label="{{ __('Breadcrumb') }}" class="bc-crumbs bc-root">
    <ol>
        <li>
            @if ($homeIsCurrent)
                <span aria-current="page">{{ __($homeLabel) }}</span>
            @else
                <a href="{{ url($homePath) }}">{{ __($homeLabel) }}</a><i class="bi bi-chevron-right" style="font-size:14px" aria-hidden="true"></i>
            @endif
        </li>
        @if (! $homeIsCurrent && ! empty($group))
            <li><span>{{ __($group) }}</span><i class="bi bi-chevron-right" style="font-size:14px" aria-hidden="true"></i></li>
        @endif
        @if (! $homeIsCurrent && ! empty($title))
            <li><span aria-current="page">{{ __($title) }}</span></li>
        @endif
    </ol>
</nav>
