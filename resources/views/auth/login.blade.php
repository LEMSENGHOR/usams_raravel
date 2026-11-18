@extends('layouts.auth')

@section('content')
    <h1>{{ __('Sign in') }}</h1>
    <p class="lp-lead">{{ __('Use your admin or lecturer account.') }}</p>

    <div class="lp-banner" id="login-banner" role="alert" hidden>
        <i class="bi bi-exclamation-triangle" style="font-size:18px" aria-hidden="true"></i><span id="login-banner-text"></span>
    </div>

    <div class="lp-root">
        <form id="login-form" novalidate>
            <div class="field">
                <label for="email">{{ __('Email') }}</label>
                <input id="email" class="input" type="email" autocomplete="username" inputmode="email">
                <span id="email-err" class="field-error" hidden></span>
            </div>

            <div class="field">
                <label for="password">{{ __('Password') }}</label>
                <div class="lp-pw">
                    <input id="password" class="input lp-input" type="password" autocomplete="current-password">
                    <button type="button" class="lp-toggle" id="pw-toggle" aria-label="{{ __('Show password') }}" aria-pressed="false"><i class="bi bi-eye" style="font-size:18px" aria-hidden="true"></i></button>
                </div>
                <span id="pw-err" class="field-error" hidden></span>
            </div>

            <label class="lp-remember"><input id="remember" type="checkbox"> {{ __('Keep me signed in on this device') }}</label>

            <button class="btn btn-primary lp-submit" type="submit" id="login-submit">{{ __('Sign in') }}</button>
        </form>
    </div>
@endsection
