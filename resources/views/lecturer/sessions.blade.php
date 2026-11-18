@extends('layouts.dashboard')

@section('content')
    <x-page-header title="Attendance Sessions" subtitle="Create a session, open it in class, mark attendance, then close it.">
        <x-slot:actions>
            <button class="btn btn-primary" type="button" id="btn-new-session"><i class="bi bi-plus-lg" aria-hidden="true"></i>{{ __('New session') }}</button>
        </x-slot:actions>
    </x-page-header>
    <x-data-panel />
@endsection
