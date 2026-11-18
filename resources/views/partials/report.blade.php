<x-page-header title="Attendance Reports" subtitle="Choose filters, then generate the report." />

<div class="card">
    <div data-role="filters"></div>
    <div class="rp-gen">
        <div class="field rp-field">
            <label for="group">{{ __('Group by') }}</label>
            <select id="group" class="input"></select>
        </div>
        <button class="btn btn-primary" type="button" id="btn-generate"><i class="bi bi-bar-chart-line" aria-hidden="true"></i>{{ __('Generate report') }}</button>
    </div>
</div>

<div id="report-result"></div>
