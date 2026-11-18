import { el, qs } from '@/modules/utils/dom'
import { t } from '@/modules/i18n'

/** Opens a native <dialog> used as a full-screen backdrop. Esc and a click outside the panel close it. */
export function openModal(dialog) {
  dialog.dataset.temp = '1'
  document.body.append(dialog)
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close() })
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  dialog.showModal()
}

function ensureConfirmDialog() {
  let dialog = qs('#confirm-dialog')
  if (dialog) return dialog
  dialog = el('dialog', { class: 'cd-backdrop', id: 'confirm-dialog', 'aria-labelledby': 'cd-title', 'aria-describedby': 'cd-msg' },
    el('div', { class: 'cd-dialog card' },
      el('h2', { id: 'cd-title' }), el('p', { id: 'cd-msg' }),
      el('div', { class: 'cd-footer' },
        el('button', { class: 'btn', type: 'button', id: 'cd-cancel' }, t('Cancel')),
        el('button', { class: 'btn btn-primary', type: 'button', id: 'cd-confirm' }, t('Confirm')))))
  document.body.append(dialog)
  return dialog
}

/**
 * Confirmation dialog (replaces ConfirmDialog.vue). `onConfirm` may be async: the dialog shows "Working…"
 * and closes when it resolves. If it throws, the dialog stays open so the user can retry or cancel.
 * Resolves true when the action was confirmed and finished, false when cancelled.
 */
export function confirmDialog({ title, message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm = null }) {
  const dialog = ensureConfirmDialog()
  const cancel = qs('#cd-cancel', dialog)
  const ok = qs('#cd-confirm', dialog)
  qs('#cd-title', dialog).textContent = t(title)
  qs('#cd-msg', dialog).textContent = t(message)
  cancel.textContent = t(cancelLabel)
  ok.textContent = t(confirmLabel)
  ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`
  cancel.disabled = ok.disabled = false

  return new Promise((resolve) => {
    const abort = new AbortController()
    const { signal } = abort
    let busy = false
    let confirmed = false
    const setBusy = (value) => {
      busy = value
      cancel.disabled = ok.disabled = value
      ok.textContent = value ? t('Working…') : t(confirmLabel)
    }

    cancel.addEventListener('click', () => dialog.close(), { signal })
    ok.addEventListener('click', async () => {
      setBusy(true)
      try {
        await onConfirm?.()
        confirmed = true
        setBusy(false)
        dialog.close()
      } catch {
        setBusy(false) // stay open
      }
    }, { signal })
    dialog.addEventListener('cancel', (e) => { if (busy) e.preventDefault() }, { signal })
    dialog.addEventListener('click', (e) => { if (e.target === dialog && !busy) dialog.close() }, { signal })
    dialog.addEventListener('close', () => { abort.abort(); resolve(confirmed) }, { once: true })

    dialog.showModal()
    ok.focus()
  })
}
