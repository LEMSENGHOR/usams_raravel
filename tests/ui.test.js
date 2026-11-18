import { describe, it, expect, vi } from 'vitest'
import { mockApi, flush } from './setup'
import { el } from '@/modules/utils/dom'
import { renderDataTable } from '@/modules/ui/table'
import { renderPagination } from '@/modules/ui/pagination'
import { searchAndFilterBar } from '@/modules/ui/filters'
import { statusSegmented } from '@/modules/ui/segmented'
import { attendanceBarChart } from '@/modules/ui/chart'
import { statusBadge } from '@/modules/ui/badge'

const box = () => document.body.appendChild(el('div'))

describe('dom helper', () => {
  it('inserts text as text, never as HTML', () => {
    const node = el('div', {}, '<img src=x onerror="alert(1)">')
    expect(node.querySelector('img')).toBeNull()
    expect(node.textContent).toBe('<img src=x onerror="alert(1)">')
  })
  it('sets properties, attributes and listeners', () => {
    const fn = vi.fn()
    const b = el('button', { class: 'btn', 'aria-label': 'x', onclick: fn, dataset: { a: '1' } }, 'Go')
    b.click()
    expect(el('button', { disabled: true }).disabled).toBe(true)
    expect(b.getAttribute('aria-label')).toBe('x')
    expect(b.dataset.a).toBe('1')
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('data table', () => {
  const columns = [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status', type: 'badge' }, { key: 'start', label: 'Starts', type: 'date' }, { key: 'faculty.name', label: 'Faculty' }]

  it('shows skeleton, error with retry, and empty states', () => {
    const c = box()
    renderDataTable(c, { columns, loading: true })
    expect(c.querySelector('.ls-skeleton')).not.toBeNull()

    const retry = vi.fn()
    renderDataTable(c, { columns, error: { message: 'Boom' }, onRetry: retry })
    expect(c.textContent).toContain('Boom')
    c.querySelector('.er-btn').click()
    expect(retry).toHaveBeenCalled()

    renderDataTable(c, { columns, rows: [], emptyTitle: 'No faculties found', emptyText: 'Add one' })
    expect(c.querySelector('.es-empty h2').textContent).toBe('No faculties found')
  })

  it('renders rows with badges, dates, nested values and action buttons', () => {
    const c = box()
    const onEdit = vi.fn()
    renderDataTable(c, {
      columns,
      rows: [{ id: 1, name: '<b>Eng</b>', status: 'ACTIVE', start: '2026-10-27', faculty: { name: 'Science' } }, { id: 2, name: 'Law', status: null, start: null }],
      actions: (row) => el('button', { class: 'btn', onclick: () => onEdit(row.id) }, 'Edit'),
    })
    const rows = c.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(c.querySelectorAll('th')).toHaveLength(5)
    expect(rows[0].querySelector('b')).toBeNull() // escaped
    expect(rows[0].querySelector('.st-badge-success').textContent).toBe('Active')
    expect(rows[0].textContent).toContain('Oct 27, 2026')
    expect(rows[0].textContent).toContain('Science')
    expect(rows[1].textContent).toContain('—')
    rows[1].querySelector('button').click()
    expect(onEdit).toHaveBeenCalledWith(2)
  })
})

describe('pagination', () => {
  it('shows totals, disables edges and reports page changes', () => {
    const c = box()
    const onChange = vi.fn()
    renderPagination(c, { page: 1, lastPage: 3, total: 25, onChange })
    expect(c.textContent).toContain('25 records · Page 1 of 3')
    const [prev, next] = c.querySelectorAll('button')
    expect(prev.disabled).toBe(true)
    next.click()
    expect(onChange).toHaveBeenCalledWith(2)
  })
  it('draws nothing for an empty single page', () => {
    const c = box()
    renderPagination(c, { page: 1, lastPage: 1, total: 0, onChange() {} })
    expect(c.children).toHaveLength(0)
  })
})

describe('search and filter bar', () => {
  it('debounces search, reports filters, and clears', async () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    const onFilter = vi.fn()
    const bar = searchAndFilterBar({ filters: [{ key: 'status', label: 'Statuses', options: [{ value: 'ACTIVE', label: 'Active' }] }, { key: 'date_from', label: 'From date', type: 'date' }], onSearch, onFilter })
    document.body.append(bar)

    const input = bar.querySelector('input[type=search]')
    input.value = 'so'; input.dispatchEvent(new Event('input'))
    input.value = 'sok'; input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(349)
    expect(onSearch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2)
    expect(onSearch).toHaveBeenCalledOnce()
    expect(onSearch).toHaveBeenCalledWith('sok')

    const select = bar.querySelector('select')
    expect(select.options[0].textContent).toBe('All statuses')
    select.value = 'ACTIVE'; select.dispatchEvent(new Event('change'))
    expect(onFilter).toHaveBeenCalledWith('status', 'ACTIVE')

    const clearBtn = [...bar.querySelectorAll('button')].find((b) => b.textContent.includes('Clear'))
    expect(clearBtn.hidden).toBe(false)
    clearBtn.click()
    expect(onSearch).toHaveBeenLastCalledWith('')
    expect(onFilter).toHaveBeenLastCalledWith('status', '')
    expect(select.value).toBe('')
    vi.useRealTimers()
  })

  it('loads remote options for a filter', async () => {
    mockApi(() => ({ body: { data: [{ id: 5, name: 'Science' }, { id: 6, name: 'Law' }] } }))
    const bar = searchAndFilterBar({ filters: [{ key: 'faculty_id', label: 'Faculties', remote: { path: '/faculties' } }], showSearch: false })
    document.body.append(bar)
    await flush()
    const opts = [...bar.querySelectorAll('option')].map((o) => [o.value, o.textContent])
    expect(opts).toEqual([['', 'All faculties'], ['5', 'Science'], ['6', 'Law']])
  })
})

describe('status controls', () => {
  it('segmented control selects one of the four manual statuses', () => {
    const onChange = vi.fn()
    const seg = statusSegmented({ name: 'Sok', value: null, onChange })
    document.body.append(seg.el)
    const radios = [...seg.el.querySelectorAll('[role=radio]')]
    expect(radios.map((r) => r.dataset.value)).toEqual(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'])
    expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true) // unmarked: nothing selected, no invented status
    radios[1].click()
    expect(onChange).toHaveBeenCalledWith('LATE')
    expect(radios[1].getAttribute('aria-checked')).toBe('true')
    expect(radios[1].classList.contains('sg-on')).toBe(true)
    expect(radios[0].classList.contains('sg-on')).toBe(false)
  })

  it('badge shows "Not marked" for a missing status and variants for known ones', () => {
    expect(statusBadge(null).textContent).toBe('Not marked')
    expect(statusBadge('LATE').className).toContain('st-badge-warning')
    expect(statusBadge('SUPER_ADMIN').textContent).toBe('Super admin')
    expect(statusBadge('WEIRD').className).toContain('st-badge-neutral')
  })

  it('bar chart draws one column per period with an accessible table', () => {
    const chart = attendanceBarChart([{ label: 'Mon', present: 8, late: 1, absent: 1, excused: 0 }, { label: 'Tue', present: 4, late: 0, absent: 0, excused: 0 }])
    expect(chart.querySelectorAll('.ch-col')).toHaveLength(2)
    expect(chart.querySelector('.ch-stack').style.height).toBe('100%')
    expect(chart.querySelectorAll('table tbody tr')).toHaveLength(2)
  })
})
