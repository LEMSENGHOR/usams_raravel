<div class="sb-scrim" id="sidebar-scrim" hidden></div>
<aside class="sb-sidebar sb-root" id="sidebar" aria-label="{{ __('Main navigation') }}">
    <div class="sb-brand">
        <span class="sb-logo"><i class="bi bi-mortarboard" aria-hidden="true"></i></span>
        <span class="sb-brand-text"><strong>USAMS</strong><small>{{ __($subtitle) }}</small></span>
        <button class="sb-close-btn" type="button" id="btn-close-menu" aria-label="{{ __('Close menu') }}"><i class="bi bi-x-lg" style="font-size:20px"></i></button>
    </div>

    <nav class="sb-scroll">
        @foreach ($nav as $group)
            <section class="sb-group">
                <h3 class="sb-group-title">{{ __($group['group']) }}</h3>
                <hr class="sb-group-rule">
                <ul>
                    @foreach ($group['items'] as $item)
                        @php
                            $path = trim($item['path'], '/');
                            $isActive = request()->is($path) || request()->is($path.'/*');
                        @endphp
                        <li>
                            <a class="sb-link {{ $isActive ? 'sb-active' : '' }}" href="{{ url($item['path']) }}" title="{{ __($item['label']) }}" @if ($isActive) aria-current="page" @endif>
                                <i class="bi bi-{{ $item['icon'] }}" aria-hidden="true"></i>
                                <span class="sb-text">{{ __($item['label']) }}</span>
                            </a>
                        </li>
                    @endforeach
                </ul>
            </section>
        @endforeach
    </nav>
</aside>
