// Usage: node scripts/check-i18n.mjs          lists English keys that have no Khmer entry
//        node scripts/check-i18n.mjs --text   also lists template text that is not wrapped in __() / t()
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import km from '../resources/js/modules/i18n/km.js'

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const jsFiles = walk('resources/js').filter((f) => f.endsWith('.js') && !f.includes('/i18n/'))
const bladeFiles = walk('resources/views').filter((f) => f.endsWith('.blade.php'))
const phpFiles = walk('app/Http/Controllers/Web').filter((f) => f.endsWith('.php'))

// Labels generated in code (capitalised enum values) and strings that reach t() through props or ternaries.
const keys = new Set(['Present', 'Late', 'Absent', 'Excused', 'Scheduled', 'Open', 'Closed', 'Cancelled', 'Upcoming', 'Active', 'Inactive', 'Suspended', 'Completed',
  'Super admin', 'Admin', 'Lecturer', 'Student', 'Not marked', 'Yes', 'Administration', 'Lecturer portal', 'Confirm', 'Nothing here yet', 'Could not load this data'])
const add = (s) => { s = String(s).replace(/\\'/g, "'"); if (s && /[A-Za-z]/.test(s)) keys.add(s) }
const q = String.raw`'((?:[^'\\]|\\.)*)'`
const jsPatterns = [
  /\bt\(\s*'((?:[^'\\]|\\.)*)'/g, /\bt\(\s*"([^"]*)"/g,
  /\b(?:label|title|subtitle|help|singular|searchPlaceholder|trueLabel|rowLinkLabel|group|message|text|description|confirmLabel|emptyTitle|emptyText|done)\s*:\s*'((?:[^'\\]|\\.)*)'/g,
  /\bcol\(\s*'[^']*'\s*,\s*'((?:[^'\\]|\\.)*)'/g, /\bsel\(\s*'[^']*'\s*,\s*'((?:[^'\\]|\\.)*)'/g,
  /toast\.(?:success|error)\(\s*'((?:[^'\\]|\\.)*)'(?:\s*,\s*'((?:[^'\\]|\\.)*)')?/g,
  /\bpageHeader\(\{ title: '((?:[^'\\]|\\.)*)'/g,
]
const bladePatterns = [
  /__\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g, /__\(\s*"([^"]*)"\s*\)/g,
  /\b(?:title|label|description|subtitle)="([^"{$]*)"/g,
]
const phpPatterns = [
  /'(?:label|group|title)'\s*=>\s*'((?:[^'\\]|\\.)*)'/g,
  /=>\s*\[\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)',\s*'[^']*'\s*\]/g,
]
const scan = (files, patterns) => { for (const f of files) { const src = readFileSync(f, 'utf8'); for (const re of patterns) for (const m of src.matchAll(re)) { add(m[1] ?? ''); if (m[2]) add(m[2]) } } }
scan(jsFiles, jsPatterns); scan(bladeFiles, bladePatterns); scan(phpFiles, phpPatterns)
for (const f of jsFiles) for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(([^()]*\?[^()]*)[,)]/g)) for (const s of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) add(s[1])

const SKIP = new Set(['English', 'name', 'email', 'text', 'number', 'date', 'time', 'select', 'password', 'textarea', 'checkbox', 'badge', 'bool', 'id', 'code'])
const CODE = /\bt\(|\s\?\s|\?\?|\.label|\.message|\s===\s|\(\)|^[a-z]+(?:\.[a-zA-Z]+)+$|^cfg\.\w+$|\$\{|\{\{|^@/
const missing = [...keys].filter((k) => !(k in km) && !SKIP.has(k) && !CODE.test(k) && k.length > 1).sort()
console.log(`${keys.size} keys found, ${missing.length} missing in km.js`)
for (const k of missing) console.log(JSON.stringify(k))

if (process.argv.includes('--text')) {
  console.log('\n--- template text not wrapped in __() or t() ---')
  for (const f of bladeFiles) {
    const src = readFileSync(f, 'utf8').replace(/\{\{--[\s\S]*?--\}\}/g, '').replace(/@php[\s\S]*?@endphp/g, '').replace(/@props\([\s\S]*?\]\)/g, '').replace(/\{\{[\s\S]*?\}\}/g, '').replace(/@json\([\s\S]*?\]\)/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
    for (const m of src.matchAll(/>([^<>{}@]*[A-Za-z]{3,}[^<>{}@]*)</g)) {
      const s = m[1].trim()
      if (s && s !== 'USAMS' && !/^[\s·–—:|/]*$/.test(s)) console.log(`${f}: ${JSON.stringify(s)}`)
    }
  }
}
