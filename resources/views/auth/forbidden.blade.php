@extends('layouts.app')

@section('body')
    <div class="fb-wrap">
        <x-empty-state icon="shield-exclamation" title="You can't open this page" description="Your account does not have access to this area.">
            <a id="forbidden-link" class="btn btn-primary" href="{{ url('login') }}">{{ __('Back to sign in') }}</a>
        </x-empty-state>
    </div>
@endsection
