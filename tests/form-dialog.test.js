import { describe, it, expect, vi } from 'vitest'
import { mockApi, flush } from './setup'
import { formDialog } from '@/modules/ui/form'
import { confirmDialog } from '@/modules/ui/dialog'

const submitForm = (dialog) => dialog.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
const set = (dialog, id, value) => { const i = dialog.querySelector(`#f-${id}`); i.value = value; i.dispatchEvent(new Event('input')); return i }
const errorOf = (dialog, id) => dialog.querySelector(`#f-${id}`).closest('.field').querySelector('.field-error')

const fields = [
  { key: 'code', label: 'Code', required: true },
  { key: 'credits', label: 'Credits', type: 'number' },
  { key: 'department_id', label: 'Department', type: 'select', required: true, remote: { path: '/departments' } },
  { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }], default: 'ACTIVE' },
  { key: 'is_current', label: 'Current', type: 'checkbox' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
]

describe('form dialog', () => {
  it('requires required fields and does not call the API', async () => {
    mockApi(() => ({ body: { data: [{ id: 3, name: 'CS' }] } }))
    const onSubmit = vi.fn()
    const { dialog } = formDialog({ title: 'Add subject', fields, onSubmit })
    await flush()
    submitForm(dialog)
    await flush()
    expect(errorOf(dialog, 'code').textContent).toBe('This field is required.')
    expect(errorOf(dialog, 'department_id').hidden).toBe(false)
    expect(errorOf(dialog, 'code').closest('.field').querySelector('input').getAttribute('aria-invalid')).toBe('true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends typed values: numbers as numbers, select ids with their original type, empty optionals as null, checkbox as boolean', async () => {
    mockApi(() => ({ body: { data: [{ id: 3, name: 'CS' }] } }))
    const onSubmit = vi.fn(async () => {})
    const onSaved = vi.fn()
    const { dialog } = formDialog({ title: 'Add subject', fields, onSubmit, onSaved })
    await flush()
    set(dialog, 'code', 'CS101')
    set(dialog, 'credits', '3')
    set(dialog, 'department_id', '3')
    dialog.querySelector('#f-is_current').checked = true
    submitForm(dialog)
    await flush()
    expect(onSubmit).toHaveBeenCalledWith({ code: 'CS101', credits: 3, department_id: 3, status: 'ACTIVE', is_current: true, notes: null })
    expect(onSaved).toHaveBeenCalled()
    expect(dialog.isConnected).toBe(false) // closed and removed
  })

  it('prefills edit values (dates, times, nested paths) and keeps the select value', async () => {
    mockApi(() => ({ body: { data: [{ id: 3, name: 'CS' }, { id: 4, name: 'IT' }] } }))
    const f = [{ key: 'start', label: 'Start', type: 'date' }, { key: 'at', label: 'At', type: 'time' }, { key: 'department_id', label: 'Dept', type: 'select', remote: { path: '/departments' } }]
    const { dialog } = formDialog({ title: 'Edit', fields: f, initial: { start: '2026-10-27T00:00:00Z', at: '08:30:00', department_id: 4 }, onSubmit: async () => {} })
    await flush()
    expect(dialog.querySelector('#f-start').value).toBe('2026-10-27')
    expect(dialog.querySelector('#f-at').value).toBe('08:30')
    expect(dialog.querySelector('#f-department_id').value).toBe('4')
  })

  it('maps 422 errors to fields and shows unmatched errors in a banner; dialog stays open', async () => {
    const onSubmit = vi.fn(async () => { throw { status: 422, message: 'x', fieldErrors: { code: ['Already used'], class_id: ['Duplicate assignment'] } } })
    const { dialog } = formDialog({ title: 'Add', fields: [{ key: 'code', label: 'Code', required: true }], onSubmit })
    set(dialog, 'code', 'X')
    submitForm(dialog)
    await flush()
    expect(errorOf(dialog, 'code').textContent).toBe('Already used')
    const banner = dialog.querySelector('.fd-banner')
    expect(banner.hidden).toBe(false)
    expect(banner.textContent).toContain('Duplicate assignment')
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(dialog.querySelector('button[type=submit]').disabled).toBe(false)
  })

  it('shows the server message for non-422 failures', async () => {
    const { dialog } = formDialog({ title: 'Add', fields: [{ key: 'code', label: 'Code' }], onSubmit: async () => { throw { status: 500, message: 'Server exploded', fieldErrors: {} } } })
    submitForm(dialog)
    await flush()
    expect(dialog.querySelector('.fd-banner').textContent).toContain('Server exploded')
  })

  it('password: required on create, omitted on edit when left blank', async () => {
    const f = [{ key: 'name', label: 'Name' }, { key: 'password', label: 'Password', type: 'password', required: true, only: 'create' }, { key: 'password', label: 'New password', type: 'password', only: 'edit' }]
    const onSubmit = vi.fn(async () => {})
    const edit = formDialog({ title: 'Edit', fields: f, initial: { name: 'A' }, onSubmit })
    submitForm(edit.dialog)
    await flush()
    expect(onSubmit).toHaveBeenCalledWith({ name: 'A' })

    const create = formDialog({ title: 'Add', fields: f, onSubmit })
    submitForm(create.dialog)
    await flush()
    expect(create.dialog.querySelector('#f-password').closest('.field').querySelector('.field-error').hidden).toBe(false)
  })

  it('closes on Cancel without saving', async () => {
    const onSubmit = vi.fn()
    const { dialog } = formDialog({ title: 'Add', fields: [{ key: 'code', label: 'Code' }], onSubmit })
    ;[...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Cancel').click()
    expect(dialog.isConnected).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('confirm dialog', () => {
  const buttons = () => ({ ok: document.querySelector('#cd-confirm'), cancel: document.querySelector('#cd-cancel'), dialog: document.querySelector('#confirm-dialog') })

  it('runs onConfirm, shows Working…, closes and resolves true', async () => {
    let release
    const onConfirm = vi.fn(() => new Promise((r) => { release = r }))
    const result = confirmDialog({ title: 'Delete this entry?', message: 'Sure?', confirmLabel: 'Delete', danger: true, onConfirm })
    const { ok, dialog } = buttons()
    expect(dialog.querySelector('#cd-title').textContent).toBe('Delete this entry?')
    expect(ok.className).toContain('btn-danger')
    ok.click()
    await flush()
    expect(ok.textContent).toBe('Working…')
    expect(ok.disabled).toBe(true)
    release()
    expect(await result).toBe(true)
    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('stays open when onConfirm throws so the user can retry', async () => {
    const onConfirm = vi.fn(async () => { throw new Error('nope') })
    const result = confirmDialog({ title: 'T', onConfirm })
    const { ok, cancel, dialog } = buttons()
    ok.click()
    await flush()
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(ok.disabled).toBe(false)
    cancel.click()
    expect(await result).toBe(false)
  })

  it('resolves false on cancel and can be reused with fresh text', async () => {
    const first = confirmDialog({ title: 'One' })
    buttons().cancel.click()
    expect(await first).toBe(false)
    const second = confirmDialog({ title: 'Two', confirmLabel: 'Go' })
    expect(buttons().dialog.querySelector('#cd-title').textContent).toBe('Two')
    expect(buttons().ok.textContent).toBe('Go')
    buttons().cancel.click()
    await second
  })
})
