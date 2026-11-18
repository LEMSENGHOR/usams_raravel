// Writes lang/km.json (used by Blade's __() helper) from the single source of truth: resources/js/modules/i18n/km.js
// Run after editing km.js:  npm run i18n:sync
import { writeFileSync, mkdirSync } from 'node:fs'
import km from '../resources/js/modules/i18n/km.js'

mkdirSync('lang', { recursive: true })
writeFileSync('lang/km.json', JSON.stringify(km, null, 4) + '\n')
console.log(`lang/km.json written with ${Object.keys(km).length} entries`)
