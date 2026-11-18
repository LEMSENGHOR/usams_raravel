@extends('layouts.dashboard')

@section('content')
    <div class="ad-root">
        <x-page-header title="Dashboard" subtitle="Overview of attendance across the university.">
            <x-slot:actions>
                <a class="btn" href="{{ url('admin/students') }}">{{ __('Add student') }}</a>
                <a class="btn" href="{{ url('admin/lecturers') }}">{{ __('Add lecturer') }}</a>
                <a class="btn" href="{{ url('admin/classes') }}">{{ __('Add class') }}</a>
                <a class="btn" href="{{ url('admin/subjects') }}">{{ __('Add subject') }}</a>
            </x-slot:actions>
        </x-page-header>

        <div class="card" id="dash-error" hidden></div>

        <div id="dash-content">
            <section class="ad-stats" aria-label="{{ __('Key figures') }}">
                <x-stat-card stat="total_students" label="Total Students" icon="people" />
                <x-stat-card stat="total_lecturers" label="Total Lecturers" icon="person-gear" />
                <x-stat-card stat="active_classes" label="Active Classes" icon="easel" />
                <x-stat-card stat="active_subjects" label="Active Subjects" icon="book" />
                <x-stat-card stat="attendance_sessions" label="Attendance Sessions" icon="calendar-check" />
                <x-stat-card stat="attendance_rate" label="Overall Attendance Rate" icon="percent" />
            </section>

            <section class="ad-grid">
                <article class="card ad-pad ad-wide">
                    <h2>{{ __('Attendance overview') }}</h2>
                    <div id="dash-overview"></div>
                </article>
                <article class="card ad-pad">
                    <h2>{{ __('Current academic year') }}</h2>
                    <div id="dash-year"></div>
                </article>
                <article class="card ad-pad">
                    <h2>{{ __('Recent attendance sessions') }}</h2>
                    <div id="dash-sessions"></div>
                </article>
                <article class="card ad-pad">
                    <h2>{{ __('Recently added people') }}</h2>
                    <div id="dash-people"></div>
                </article>
            </section>
        </div>
    </div>
@endsection
