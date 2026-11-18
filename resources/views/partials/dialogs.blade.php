{{-- Confirm dialog shell. resources/js/modules/ui/dialog.js fills in the text and wires the buttons. --}}
<dialog class="cd-backdrop" id="confirm-dialog" aria-labelledby="cd-title" aria-describedby="cd-msg">
    <div class="cd-dialog card">
        <h2 id="cd-title"></h2>
        <p id="cd-msg"></p>
        <div class="cd-footer">
            <button class="btn" type="button" id="cd-cancel">{{ __('Cancel') }}</button>
            <button class="btn btn-primary" type="button" id="cd-confirm">{{ __('Confirm') }}</button>
        </div>
    </div>
</dialog>
