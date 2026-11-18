import km from './km'

/**
 * Tiny i18n layer (same API as the Vue version). The English text IS the key: t('Save').
 * Blade pages are server-rendered per language, so the language is fixed for the whole page load:
 * it is read once from <html lang>, which Laravel sets from the usams_locale cookie.
 * Use {name} placeholders for dynamic parts: t('Page {page} of {last}', { page: 2, last: 9 }).
 */
export const locale = document.documentElement.lang === 'km' ? 'km' : 'en'
export const LOCALES = [
  { value: 'en', short: 'EN', label: 'English', lang: 'en' },
  { value: 'km', short: 'ខ្មែរ', label: 'ខ្មែរ', lang: 'km' },
]

const KHMER = /[\u1780-\u17FF]/
export const missing = new Set() // strings with no Khmer entry (dev aid: window.__missingI18n)
if (typeof window !== 'undefined') window.__missingI18n = missing

export function t(text, params) {
  if (text === null || text === undefined) return ''
  let s = String(text)
  if (locale === 'km') {
    const hit = km[s]
    if (hit !== undefined) s = hit
    else if (!KHMER.test(s)) missing.add(s) // server text or already-translated text passes through
  }
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m)) : s
}

/** Lowercase in English ("All statuses"); Khmer has no case. */
export const tl = (text) => (locale === 'km' ? t(text) : String(text).toLowerCase())
/** Capitalized first letter in English ("Faculty created"); no-op in Khmer. */
export const tc = (text) => {
  const s = t(text)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export const localeTag = () => (locale === 'km' ? 'km-KH' : 'en-US')
