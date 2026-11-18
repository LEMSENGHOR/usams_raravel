{{-- Shown by Laravel for unknown web addresses. It does not change what API clients receive. --}}
@extends('layouts.app', ['area' => 'any', 'page' => 'notfound', 'title' => 'Page not found'])

@section('body')
    <div class="fb-wrap">
        <x-empty-state icon="search" title="Page not found" description="The address may be wrong, or the page was moved.">
            <a id="forbidden-link" class="btn btn-primary" href="{{ url('login') }}">{{ __('Back to sign in') }}</a>
        </x-empty-state>
    </div>
@endsection
