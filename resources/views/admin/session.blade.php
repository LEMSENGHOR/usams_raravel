@extends('layouts.dashboard')

@section('content')
    <div class="as-root">
        <a class="as-back" id="back-link" href="#"><i class="bi bi-arrow-left" aria-hidden="true"></i>{{ __('Back to sessions') }}</a>
        <div id="sheet-root" data-id="{{ $sessionId }}"></div>
    </div>
@endsection
