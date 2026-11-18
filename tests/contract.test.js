// Static checks that Blade, PHP routes and JavaScript agree with each other (no PHP runtime needed).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd() // tests are run from the project root (npm test)
const read = (p) => readFileSync(join(root, p), 'utf8')
const walk = (d) => readdirSync(join(root, d)).flatMap((f) => { const p = `${d}/${f}`; return statSync(join(root, p)).isDirectory() ? walk(p) : [p] })
const blade = walk('resources/views').filter((f) => f.endsWith('.blade.php'))
const bladeText = blade.map(read).join('\n')
const controller = read('app/Http/Controllers/Web/PageController.php')
const routes = read('routes/usams.php')

describe('Blade <-> JS contract', () => {
  it('every page named by the controller has a JS module', () => {
    const pages = [...controller.matchAll(/'page' => '([\w-]+)'/g)].map((m) => m[1])
    expect(pages.length).toBeGreaterThan(10)
    for (const p of pages) expect(existsSync(join(root, `resources/js/pages/${p}.js`)), `pages/${p}.js`).toBe(true)
  })

  it('every view the controller renders exists', () => {
    const views = [...controller.matchAll(/(?:view|render)\([^)]*?'((?:admin|lecturer|auth)\.[\w-]+)'/g)].map((m) => m[1])
    expect(views.length).toBeGreaterThan(10)
    for (const v of views) expect(existsSync(join(root, `resources/views/${v.replace('.', '/')}.blade.php`)), v).toBe(true)
  })

  it('every route action exists on the controller', () => {
    const actions = [...routes.matchAll(/PageController::class, '(\w+)'/g)].map((m) => m[1])
    expect(actions.length).toBeGreaterThanOrEqual(15)
    for (const a of actions) expect(controller, a).toMatch(new RegExp(`function ${a}\\(`))
  })

  it('every @extends, @include and <x-component> target exists', () => {
    for (const m of bladeText.matchAll(/@(?:extends|include)\('([\w.]+)'/g)) expect(existsSync(join(root, `resources/views/${m[1].replaceAll('.', '/')}.blade.php`)), m[1]).toBe(true)
    for (const m of bladeText.matchAll(/<x-(?!slot)([\w-]+)/g)) expect(existsSync(join(root, `resources/views/components/${m[1]}.blade.php`)), `x-${m[1]}`).toBe(true)
  })

  it('every #id selector used by page and shell modules is present in Blade (or created by JS)', () => {
    const jsFiles = [...walk('resources/js/pages'), 'resources/js/modules/shell.js'].filter((f) => f.endsWith('.js'))
    const bladeIds = new Set([...bladeText.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]))
    const jsIds = new Set(walk('resources/js').flatMap((f) => [...read(f).matchAll(/\bid: '([\w-]+)'/g)].map((m) => m[1])))
    const problems = []
    for (const f of jsFiles) for (const m of read(f).matchAll(/qs\('#([\w-]+)'/g)) if (!bladeIds.has(m[1]) && !jsIds.has(m[1])) problems.push(`${f}: #${m[1]}`)
    expect(problems).toEqual([])
  })

  it('JS resource keys used by the controller exist in the resources config', () => {
    const cfg = read('resources/js/modules/config/resources.js')
    const keys = [...controller.matchAll(/=> \['[^']+', '[^']+', '([\w-]+)'\]/g)].map((m) => m[1])
    expect(keys.length).toBe(17)
    for (const k of keys) expect(cfg, k).toMatch(new RegExp(`(?:^|\\n)\\s*(?:'${k}'|${k}):\\s*\\{`))
  })

  it('does not define a catch-all or API route (backend untouched)', () => {
    expect(routes).not.toMatch(/Route::fallback|Route::any|['"]api\//)
    expect(routes).not.toMatch(/Route::(post|put|patch|delete)/)
  })

  it('every Blade __() string and nav label has a Khmer translation', async () => {
    const km = (await import('../resources/js/modules/i18n/km.js')).default
    const keys = new Set([...bladeText.matchAll(/__\('((?:[^'\\]|\\.)*)'\)/g)].map((m) => m[1].replace(/\\'/g, "'")))
    for (const m of controller.matchAll(/'(?:label|group)' => '([^']+)'/g)) keys.add(m[1])
    const missing = [...keys].filter((k) => !(k in km))
    expect(missing).toEqual([])
    const json = JSON.parse(read('lang/km.json'))
    expect(Object.keys(json).length).toBe(Object.keys(km).length)
  })
})
