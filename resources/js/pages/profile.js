import { qs, el, clear } from '@/modules/utils/dom'
import { pageHeader } from '@/modules/ui/pageHeader'
import { errorState, loadingSkeleton } from '@/modules/ui/states'
import { cellValue } from '@/modules/ui/table'
import api from '@/api/client'
import { endpoints, features } from '@/modules/config/endpoints'
import { toast } from '@/modules/toast'
import { t } from '@/modules/i18n'

const cols = [
  { key: 'lecturer_code', label: 'Lecturer code' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
  { key: 'department.name', label: 'Department' }, { key: 'academic_title', label: 'Academic title' }, { key: 'status', label: 'Account status', type: 'badge' },
]

export default function init() {
  const root = qs('#profile-root')

  async function load() {
    clear(root).append(loadingSkeleton())
    let profile
    try {
      const body = await api.get(endpoints.lecturer.profile)
      profile = body?.data ?? body
    } catch (error) {
      clear(root).append(el('div', { class: 'card' }, errorState({ message: error.message, onRetry: load })))
      return
    }
    clear(root).append(
      el('section', { class: 'card pp-pad' },
        el('dl', {}, cols.map((c) => el('div', {}, el('dt', {}, t(c.label)), el('dd', {}, cellValue(c, profile))))),
        el('p', { class: 'pp-note' }, t('Profile details are managed by the university administration.'))),
      features.passwordChange ? passwordForm() : null)
  }

  // Password change is shown only when features.passwordChange is true (the backend must provide it).
  function passwordForm() {
    const fieldsDef = [
      ['current_password', 'cp', 'Current password', 'current-password'],
      ['password', 'np', 'New password', 'new-password'],
      ['password_confirmation', 'cf', 'Confirm new password', 'new-password'],
    ]
    const inputs = {}
    const errors = {}
    const rows = fieldsDef.map(([name, id, label, auto]) => {
      inputs[name] = el('input', { id, class: 'input', type: 'password', autocomplete: auto })
      errors[name] = el('span', { class: 'field-error', hidden: true })
      return el('div', { class: 'field' }, el('label', { for: id }, t(label)), inputs[name], errors[name])
    })
    const submit = el('button', { class: 'btn btn-primary', type: 'submit' }, t('Change password'))
    const form = el('form', { class: 'card pp-pad pp-pwd', novalidate: true }, el('h2', {}, t('Change password')), rows, submit)

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      for (const name of Object.keys(errors)) { errors[name].hidden = true; inputs[name].removeAttribute('aria-invalid') }
      submit.disabled = true
      submit.textContent = t('Saving…')
      try {
        await api.post(endpoints.lecturer.password, Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value])))
        toast.success('Password changed')
        for (const input of Object.values(inputs)) input.value = ''
      } catch (err) {
        const fe = err.fieldErrors ?? {}
        for (const [k, m] of Object.entries(fe)) if (errors[k]) { errors[k].textContent = t(m[0]); errors[k].hidden = false; inputs[k].setAttribute('aria-invalid', 'true') }
        if (!Object.keys(fe).length) toast.error('Could not change password', err.message)
      } finally {
        submit.disabled = false
        submit.textContent = t('Change password')
      }
    })
    return form
  }
  load()
}
