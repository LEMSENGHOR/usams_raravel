<header class="tb-topbar">
    <button class="tb-icon-btn tb-mobile-only" type="button" id="btn-open-menu" aria-label="{{ __('Open menu') }}"><i class="bi bi-list" style="font-size:20px"></i></button>
    <button class="tb-icon-btn tb-desktop-only" type="button" id="btn-collapse" aria-label="{{ __('Collapse sidebar') }}" data-label-collapse="{{ __('Collapse sidebar') }}" data-label-expand="{{ __('Expand sidebar') }}"><i class="bi bi-layout-sidebar-inset" style="font-size:20px"></i></button>

    <div class="tb-spacer"></div>

    <x-language-toggle />
    <x-theme-toggle />

    <div class="tb-user" id="user-menu">
        <button class="tb-user-btn" type="button" id="user-menu-btn" aria-haspopup="menu" aria-expanded="false">
            <span class="tb-avatar" id="user-avatar" aria-hidden="true">?</span>
            <span class="tb-who"><strong id="user-name"></strong></span>
            <i class="bi bi-chevron-down" style="font-size:16px" aria-hidden="true"></i>
        </button>
        <div class="tb-menu card" id="user-dropdown" role="menu" hidden>
            <div class="tb-menu-head">
                <strong id="user-name-full"></strong>
                <span class="tb-muted" id="user-email"></span>
                <span id="user-role"></span>
            </div>
            <button class="tb-menu-item" type="button" role="menuitem" id="btn-logout"><i class="bi bi-box-arrow-right" style="font-size:16px" aria-hidden="true"></i>{{ __('Sign out') }}</button>
        </div>
    </div>
</header>
