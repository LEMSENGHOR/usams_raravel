@props(['status' => null])
@php
    $variants = [
        'PRESENT' => 'success', 'LATE' => 'warning', 'ABSENT' => 'danger', 'EXCUSED' => 'info',
        'SCHEDULED' => 'info', 'OPEN' => 'success', 'CLOSED' => 'neutral', 'CANCELLED' => 'danger',
        'UPCOMING' => 'info', 'ACTIVE' => 'success', 'COMPLETED' => 'neutral',
        'INACTIVE' => 'neutral', 'SUSPENDED' => 'danger',
        'SUPER_ADMIN' => 'info', 'ADMIN' => 'info', 'LECTURER' => 'success', 'STUDENT' => 'neutral',
    ];
    $variant = $status ? ($variants[$status] ?? 'neutral') : 'neutral';
    $label = $status ? ucfirst(strtolower(str_replace('_', ' ', $status))) : 'Not marked';
@endphp
<span class="st-badge st-badge-{{ $variant }} {{ $status ? '' : 'st-badge-unmarked' }}"><span class="st-dot" aria-hidden="true"></span>{{ __($label) }}</span>
