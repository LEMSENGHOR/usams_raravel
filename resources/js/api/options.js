import { createResource } from './resource'
import { getPath } from '@/modules/utils/helpers'

/**
 * Options for a select, either static (`spec.options`) or loaded from the API (`spec.remote`).
 * remote: { path, label: 'name' | (item)=>string, value: 'id', params }
 * Static labels are config text, so they are flagged { i18n: true } and translated when rendered.
 */
export function staticOptions(spec) {
  if (!spec.options) return null
  return spec.options.map((o) => ({ ...(typeof o === 'object' ? o : { value: o, label: o }), i18n: true }))
}

export async function loadRemoteOptions(spec) {
  const r = spec.remote
  const { items } = await createResource(r.path).list({ per_page: 200, ...(r.params ?? {}) })
  const label = r.label ?? 'name'
  return items.map((i) => ({
    value: i[r.value ?? 'id'],
    label: typeof label === 'function' ? label(i) : getPath(i, label) ?? `#${i.id}`,
  }))
}
