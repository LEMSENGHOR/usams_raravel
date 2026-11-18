import './bootstrap';
import { initTheme } from '@/modules/theme'
import { guard } from '@/modules/auth'
import { initShell } from '@/modules/shell'

// Every Blade page names its script in <body data-page="...">; only that module is loaded.
const pages = import.meta.glob('./pages/*.js')

async function boot() {
  try {
    initTheme()
    const area = document.body.dataset.area ?? 'guest'
    const page = document.body.dataset.page

    if (!(await guard(area))) return // redirecting to /login or /forbidden
    if (area === 'admin' || area === 'lecturer') initShell()

    const load = pages[`./pages/${page}.js`]
    if (load) (await load()).default()
  } finally {
    document.body.classList.remove('is-booting')
  }
}

boot()
