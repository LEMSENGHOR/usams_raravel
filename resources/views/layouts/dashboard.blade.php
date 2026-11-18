@extends('layouts.app')

@section('body')
    <a class="sh-skip" href="#main">{{ __('Skip to main content') }}</a>
    <div data-guarded>
        @include('partials.sidebar')
        <div class="sh-main-wrap" id="main-wrap">
            @include('partials.topbar')
            <main id="main" class="sh-content" tabindex="-1">
                @include('partials.breadcrumbs')
                @yield('content')
            </main>
        </div>
    </div>
    @include('partials.dialogs')
@endsection
