@extends('layouts.dashboard')

@section('content')
    {{-- Header, search/filters, table and pager are filled by resources/js/pages/resource.js from modules/config/resources.js --}}
    <x-page-header :title="$title" />
    <x-data-panel />
@endsection
