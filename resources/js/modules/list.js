/**
 * Search + filters + pagination state for any list endpoint (replaces the useResourceList composable).
 * `onChange` is called after every state change so the page can redraw.
 */
export function createResourceList(service, { perPage = 15, fixedParams = {}, onChange = () => {} } = {}) {
  const state = {
    items: [],
    loading: false,
    error: null,
    query: { search: '', page: 1, filters: {} },
    meta: { page: 1, lastPage: 1, total: 0 },
  }
  let seq = 0

  async function load() {
    const mine = ++seq
    state.loading = true
    state.error = null
    onChange(state)
    try {
      const params = { ...fixedParams, page: state.query.page, per_page: perPage }
      if (state.query.search) params.search = state.query.search
      for (const [k, v] of Object.entries(state.query.filters)) if (v !== '' && v != null) params[k] = v
      const r = await service.list(params)
      if (mine !== seq) return // a newer request superseded this one
      state.items = r.items
      Object.assign(state.meta, { page: r.page, lastPage: r.lastPage, total: r.total })
    } catch (e) {
      if (mine === seq) state.error = e
    } finally {
      if (mine === seq) {
        state.loading = false
        onChange(state)
      }
    }
  }

  const setSearch = (v) => { state.query.search = v; state.query.page = 1; return load() }
  const setFilter = (k, v) => { state.query.filters[k] = v; state.query.page = 1; return load() }
  const setPage = (p) => { state.query.page = p; return load() }

  return { state, load, setSearch, setFilter, setPage }
}
