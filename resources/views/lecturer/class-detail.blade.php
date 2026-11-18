@extends('layouts.dashboard')

@section('content')
    <div class="cp-root">
        <a class="cp-back" id="back-link" href="#"><i class="bi bi-arrow-left" aria-hidden="true"></i>{{ __('Back to my classes') }}</a>
        <div id="class-root" data-id="{{ $classId }}"></div>
    </div>
@endsection
