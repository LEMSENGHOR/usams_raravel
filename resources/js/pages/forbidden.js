import { qs } from '@/modules/utils/dom'
import { getHomePath } from '@/modules/auth'
import { t } from '@/modules/i18n'
import { url } from '@/modules/utils/helpers'

export default function init() {
  const link = qs('#forbidden-link')
  const home = getHomePath()
  link.href = url(home ?? '/login')
  link.textContent = home ? t('Go to my dashboard') : t('Back to sign in')
}
