import { qs } from '@/modules/utils/dom'
import { login } from '@/modules/auth'
import { icon } from '@/modules/ui/icon'
import { t } from '@/modules/i18n'
import { url } from '@/modules/utils/helpers'
import { navigate } from '@/modules/utils/nav'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function init() {
  const form = qs('#login-form')
  const email = qs('#email')
  const password = qs('#password')
  const remember = qs('#remember')
  const submit = qs('#login-submit')
  const toggle = qs('#pw-toggle')
  const banner = qs('#login-banner')
  const params = new URLSearchParams(window.location.search)

  const setBanner = (tone, text) => {
    banner.hidden = !text
    banner.className = `lp-banner lp-banner-${tone}`
    qs('#login-banner-text').textContent = text ? t(text) : ''
  }
  const setError = (input, node, message) => {
    node.textContent = message ? t(message) : ''
    node.hidden = !message
    if (message) input.setAttribute('aria-invalid', 'true')
    else input.removeAttribute('aria-invalid')
  }
  const emailErr = qs('#email-err')
  const passwordErr = qs('#pw-err')

  if (params.get('reason') === 'expired') setBanner('info', 'Your session expired. Sign in again.')

  toggle.addEventListener('click', () => {
    const show = password.type === 'password'
    password.type = show ? 'text' : 'password'
    toggle.setAttribute('aria-label', show ? t('Hide password') : t('Show password'))
    toggle.setAttribute('aria-pressed', String(show))
    toggle.replaceChildren(icon(show ? 'eye-slash' : 'eye', 18))
  })

  function validate() {
    const value = email.value.trim()
    setError(email, emailErr, !value ? 'Enter your email address.' : !emailPattern.test(value) ? 'Enter a valid email address.' : '')
    setError(password, passwordErr, password.value ? '' : 'Enter your password.')
    return !emailErr.textContent && !passwordErr.textContent
  }

  // Only follow ?redirect= when it stays inside the user's own area (prevents open redirects).
  function targetFor(home) {
    const wanted = params.get('redirect') ?? ''
    const area = home.split('/')[1] // "admin" | "lecturer"
    return wanted.startsWith(`/${area}/`) ? wanted : home
  }

  const setLoading = (loading) => {
    submit.disabled = loading
    submit.replaceChildren(...(loading ? [icon('arrow-repeat', 16, 'lp-spin'), ` ${t('Signing in…')}`] : [t('Sign in')]))
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setBanner('error', '')
    if (!validate()) return
    setLoading(true)
    try {
      const home = await login({ email: email.value.trim(), password: password.value, remember: remember.checked })
      navigate.replace(url(targetFor(home)))
    } catch (err) {
      setLoading(false)
      if (err.status === 401) setBanner('error', 'Email or password is incorrect.')
      else if (err.status === 422 && Object.keys(err.fieldErrors ?? {}).length) {
        setError(email, emailErr, err.fieldErrors.email?.[0] ?? '')
        setError(password, passwordErr, err.fieldErrors.password?.[0] ?? '')
      } else {
        // 403 (inactive/suspended/no dashboard), 5xx, network: the message is already user-readable.
        setBanner('error', err.message ?? 'Could not sign in. Try again.')
      }
    }
  })
}
