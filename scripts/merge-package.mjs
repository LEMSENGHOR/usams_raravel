// Adds what the Blade front end needs to a Laravel package.json. Never removes or lowers anything
// (Vue packages stay until you decide to remove them in the cleanup phase).
import { readFileSync, writeFileSync } from 'node:fs'
const file = process.argv[2]
const pkg = JSON.parse(readFileSync(file, 'utf8'))
const need = {
  dependencies: { 'bootstrap-icons': '^1.11.3' },
  devDependencies: { vite: '^7.0.7', 'laravel-vite-plugin': '^2.0.0', vitest: '^3.2.4', jsdom: '^26.0.0' },
}
const added = []
for (const [section, deps] of Object.entries(need)) {
  pkg[section] ??= {}
  for (const [name, version] of Object.entries(deps)) {
    const other = section === 'dependencies' ? 'devDependencies' : 'dependencies'
    if (!(name in pkg[section]) && !(name in (pkg[other] ?? {}))) { pkg[section][name] = version; added.push(name) }
  }
}
pkg.type ??= 'module'
pkg.scripts ??= {}
const scripts = { dev: 'vite', build: 'vite build', test: 'vitest run', 'i18n:sync': 'node scripts/sync-km.mjs', 'i18n:check': 'node scripts/check-i18n.mjs --text' }
for (const [k, v] of Object.entries(scripts)) pkg.scripts[k] ??= v
writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
console.log(added.length ? `package.json: added ${added.join(', ')}` : 'package.json: nothing to add')
