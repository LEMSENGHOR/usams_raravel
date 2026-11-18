@extends('layouts.dashboard')

@section('content')
    <div class="ld-root">
        <header class="ph-page-header">
            <div>
                {{-- JavaScript replaces the name once the signed-in user is known. --}}
                <h1 id="welcome-title">{{ str_replace('{name}', __('Lecturer'), __('Welcome, {name}')) }}</h1>
                <p class="ph-subtitle">{{ __('Your classes and attendance at a glance.') }}</p>
            </div>
            <div class="ph-actions">
                <a href="{{ url('lecturer/attendance/sessions') }}" class="btn btn-primary">{{ __('Attendance sessions') }}</a>
            </div>
        </header>

        <div class="card" id="dash-error" hidden></div>

        <div id="dash-content">
            <section class="ld-stats" aria-label="{{ __('Key figures') }}">
                <x-stat-card stat="assigned_classes" label="Assigned classes" icon="easel" />
                <x-stat-card stat="assigned_subjects" label="Assigned subjects" icon="book" />
                <x-stat-card stat="today_classes" label="Today’s classes" icon="clock" />
                <x-stat-card stat="sessions_opened_today" label="Sessions opened today" icon="calendar-check" />
            </section>

            <section class="ld-grid">
                <article class="card ld-pad"><h2>{{ __('Today’s classes') }}</h2><div id="dash-today"></div></article>
                <article class="card ld-pad"><h2>{{ __('Upcoming timetable') }}</h2><div id="dash-upcoming"></div></article>
                <article class="card ld-pad"><h2>{{ __('Recent attendance sessions') }}</h2><div id="dash-sessions"></div></article>
                <article class="card ld-pad"><h2>{{ __('Attendance by class') }}</h2><div id="dash-summaries"></div></article>
            </section>
        </div>
    </div>
@endsection
