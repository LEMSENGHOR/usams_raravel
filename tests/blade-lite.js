// Renders the @section('content') of a real Blade view into plain HTML so page tests run against the SAME markup
// Laravel will serve. It only understands the few constructs used inside page bodies (not the layouts).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const file = (name) => readFileSync(join(process.cwd(), 'resources/views', `${name.replaceAll('.', '/')}.blade.php`), 'utf8')

export function renderView(name, vars = {}) {
  let s = file(name)
  const section = s.match(/@section\('content'\)([\s\S]*?)@endsection/)
  if (section) s = section[1]
  return render(s, vars)
}

function render(s, vars) {
  s = s.replace(/\{\{--[\s\S]*?--\}\}/g, '')
  s = s.replace(/@include\('([^']+)'\)/g, (_, n) => render(file(n), vars))
  // components
  s = s.replace(/<x-page-header[^>]*>\s*<x-slot:actions>([\s\S]*?)<\/x-slot:actions>\s*<\/x-page-header>/g, (_, a) => `<header class="ph-page-header"><div><h1></h1></div><div class="ph-actions">${a}</div></header>`)
  s = s.replace(/<x-page-header[^>]*\/>/g, '<header class="ph-page-header"><div><h1></h1></div><div class="ph-actions"></div></header>')
  s = s.replace(/<x-(theme|language)-toggle\s*\/>/g, (_, n) => render(file(`components.${n}-toggle`), vars))
  s = s.replace(/<x-data-panel\s*\/>/g, file('components.data-panel').replace(/\{\{--[\s\S]*?--\}\}/g, ''))
  s = s.replace(/<x-stat-card[^>]*stat="([^"]+)"[^>]*\/>/g, '<div class="card sc-stat" data-stat="$1"><div data-skeleton></div><div data-value hidden>—</div></div>')
  // expressions
  s = s.replace(/\{\{\s*url\('([^']*)'\)\s*\}\}/g, '/$1')
  s = s.replace(/\{\{\s*__\('((?:[^'\\]|\\.)*)'\)\s*\}\}/g, '$1')
  s = s.replace(/\{\{\s*\$(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
  s = s.replace(/\{\{[\s\S]*?\}\}/g, '')
  return s
}

export const renderPartial = (name, vars = {}) => render(file(name), vars)
