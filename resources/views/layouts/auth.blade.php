@extends('layouts.app')

@section('body')
    <div class="al-auth">
        <aside class="al-aside" aria-hidden="true">
            <div class="al-aside-inner">
                <span class="al-logo"><i class="bi bi-mortarboard" style="font-size:28px"></i></span>
                <h2>{{ __('University Student Attendance Management System') }}</h2>
                <p>{{ __('Attendance for classes, lecturers and academic records, in one place.') }}</p>
            </div>
        </aside>
        <main class="al-panel">
            <div class="al-theme">
                <x-language-toggle />
                <x-theme-toggle />
            </div>
            <div class="al-form-wrap">
                <div class="al-mobile-brand">
                    <span class="al-logo"><i class="bi bi-mortarboard" style="font-size:22px"></i></span><strong>USAMS</strong>
                </div>
                @yield('content')
            </div>
        </main>
    </div>
@endsection
