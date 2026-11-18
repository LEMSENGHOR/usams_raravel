import { qsa } from '@/modules/utils/dom'

const KEY = 'usams_theme' // 'light' | 'dark' | 'system'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const stored = localStorage.getItem(KEY)
let mode = ['light', 'dark', 'system'].includes(stored) ? stored : 'system'

export const getMode = () => mode
export const effective = () => (mode === 'system' ? (media.matches ? 'dark' : 'light') : mode)

function apply() {
  document.documentElement.dataset.theme = effective()
}

function paintToggles() {
  for (const btn of qsa('[data-theme-mode]')) {
    const on = btn.dataset.themeMode === mode
    btn.setAttribute('aria-checked', String(on))
    btn.classList.toggle('tt-on', on)
  }
}

export function setMode(next) {
  mode = next
  localStorage.setItem(KEY, next)
  apply()
  paintToggles()
}

export function initTheme() {
  apply()
  // Follow the OS setting live while the user is on "system".
  media.addEventListener('change', apply)
  for (const btn of qsa('[data-theme-mode]')) btn.addEventListener('click', () => setMode(btn.dataset.themeMode))
  paintToggles()
}
