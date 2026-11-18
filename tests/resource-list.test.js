import { describe, it, expect } from 'vitest'
import { mockApi, flush, tick } from './setup'
import { createResource, normalizeList } from '@/api/resource'
import { createResourceList } from '@/modules/list'
import { toCsv } from '@/modules/utils/csv'

describe('resource service', () => {
  it('normalizes Laravel paginators with and without meta', () => {
    expect(normalizeList({ data: [{ id: 1 }], meta: { current_page: 2, last_page: 5, total: 41 } })).toEqual({ items: [{ id: 1 }], page: 2, lastPage: 5, total: 41 })
    expect(normalizeList({ data: [{ id: 1 }], current_page: 1, last_page: 1, total: 1 }).total).toBe(1)
    expect(normalizeList([{ id: 1 }, { id: 2 }]).total).toBe(2)
  })

  it('uses the same HTTP methods and unwraps data', async () => {
    const calls = mockApi(() => ({ body: { data: { id: 9, name: 'N' } } }))
    const s = createResource('/faculties')
    expect(await s.create({ name: 'N' })).toEqual({ id: 9, name: 'N' })
    await s.update(9, { name: 'M' })
    await s.patch(9, { status: 'INACTIVE' })
    await s.remove(9)
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['POST /api/faculties', 'PUT /api/faculties/9', 'PATCH /api/faculties/9', 'DELETE /api/faculties/9'])
  })
})

describe('createResourceList', () => {
  it('sends page, per_page, search and only non-empty filters, and resets to page 1', async () => {
    const calls = mockApi(() => ({ body: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } }))
    const list = createResourceList(createResource('/students'))
    await list.setPage(3)
    await list.setFilter('status', 'ACTIVE')
    await list.setFilter('major_id', '')
    await list.setSearch('sok')
    expect(calls[0].url).toBe('/api/students?page=3&per_page=15')
    expect(calls[1].url).toBe('/api/students?page=1&per_page=15&status=ACTIVE')
    expect(calls[3].url).toBe('/api/students?page=1&per_page=15&search=sok&status=ACTIVE')
  })

  it('ignores a slow earlier response when a newer request finished', async () => {
    let n = 0
    mockApi(async () => {
      const mine = ++n
      await tick(mine === 1 ? 30 : 0)
      return { body: { data: [{ id: mine }], meta: { current_page: 1, last_page: 1, total: 1 } } }
    })
    const list = createResourceList(createResource('/x'))
    const first = list.load()
    const second = list.load()
    await Promise.all([first, second])
    expect(list.state.items).toEqual([{ id: 2 }])
    expect(list.state.loading).toBe(false)
  })

  it('exposes the API error and notifies after each change', async () => {
    mockApi(() => ({ status: 500 }))
    const seen = []
    const list = createResourceList(createResource('/x'), { onChange: (s) => seen.push({ loading: s.loading, error: !!s.error }) })
    await list.load()
    expect(seen).toEqual([{ loading: true, error: false }, { loading: false, error: true }])
  })
})

describe('csv', () => {
  it('quotes values and neutralises spreadsheet formulas', () => {
    const csv = toCsv([{ label: 'A', get: (r) => r.a }, { label: 'B', get: (r) => r.b }], [{ a: 'x,y', b: '=SUM(1)' }, { a: 'say "hi"', b: 'សួស្តី' }])
    expect(csv).toBe('A,B\r\n"x,y",\'=SUM(1)\r\n"say ""hi""",សួស្តី')
  })
})
