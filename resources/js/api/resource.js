import api from './client'

const unwrap = (body) => body?.data ?? body

/** Handles Laravel paginator JSON both with and without API Resources. */
// export function normalizeList(body) {
//   const items = Array.isArray(body) ? body : body?.data ?? body?.items ?? []
//   const meta = body?.meta ?? body ?? {}
//   return {
//     items,
//     page: meta.current_page ?? 1,
//     lastPage: meta.last_page ?? 1,
//     total: meta.total ?? items.length,
//   }
// }


/**
 * Normalize Laravel paginator JSON
 * Supports:
 * 1. Laravel paginator directly
 * 2. Wrapped response: { success, message, data: paginator }
 * 3. API Resource pagination
 */
// export function normalizeList(body) {
//     // Unwrap Laravel API response
//     const payload = body?.data ?? body;

//     // Extract actual items
//     const items = Array.isArray(payload)
//         ? payload
//         : Array.isArray(payload?.data)
//             ? payload.data
//             : Array.isArray(payload?.items)
//                 ? payload.items
//                 : [];

//     // Extract pagination metadata
//     const meta = payload?.meta ?? payload;

//     return {
//         items,
//         page: meta?.current_page ?? meta?.page ?? 1,
//         lastPage: meta?.last_page ?? meta?.lastPage ?? 1,
//         total: meta?.total ?? items.length,
//     };
// }
 
export function normalizeList(body, requestedPerPage = null) {
  const inner = body && !Array.isArray(body.data) && Array.isArray(body.data?.data) ? body.data : null
  const root = inner ?? body
  const items = Array.isArray(root) ? root : root?.data ?? root?.items ?? root?.results ?? []
  const sources = [root?.meta, root?.meta?.pagination, root?.pagination, root?.paginator, body?.meta, body?.meta?.pagination, body?.pagination, root, body]
  const pick = (...keys) => {
    for (const source of sources) for (const key of keys) if (source && source[key] != null && !Number.isNaN(Number(source[key]))) return Number(source[key])
    return null
  }
  const total = pick('total', 'total_items', 'totalItems', 'total_records', 'totalRecords', 'recordsTotal')
  const perPage = pick('per_page', 'perPage', 'page_size', 'pageSize', 'limit') ?? (requestedPerPage ? Number(requestedPerPage) : null)
  let lastPage = pick('last_page', 'lastPage', 'total_pages', 'totalPages', 'pages')
  if (lastPage == null && total != null && perPage) lastPage = Math.ceil(total / perPage)
  return {
    items,
    page: pick('current_page', 'currentPage', 'page') ?? 1,
    lastPage: Math.max(1, lastPage ?? 1),
    total: total ?? items.length,
  }
}

export function createResource(path) {
  return {
    path,
    // list: async (params = {}) => normalizeList(await api.get(path, params)),
        list: async (params = {}) => normalizeList(await api.get(path, params), params.per_page),
    get: async (id) => unwrap(await api.get(`${path}/${id}`)),
    create: async (data) => unwrap(await api.post(path, data)),
    update: async (id, data) => unwrap(await api.put(`${path}/${id}`, data)),
    patch: async (id, data) => unwrap(await api.patch(`${path}/${id}`, data)),
    remove: async (id) => api.delete(`${path}/${id}`),
  }
}
