import { qs, el } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { renderDataTable } from '@/modules/ui/table'
import { renderPagination } from '@/modules/ui/pagination'
import { searchAndFilterBar } from '@/modules/ui/filters'
import { formDialog } from '@/modules/ui/form'
import { detailDialog } from '@/modules/ui/detail'
import { confirmDialog } from '@/modules/ui/dialog'
import { resources } from '@/modules/config/resources'
import { createResource } from '@/api/resource'
import { createResourceList } from '@/modules/list'
import { toast } from '@/modules/toast'
import { t, tc, tl } from '@/modules/i18n'
import { url } from '@/modules/utils/helpers'
import { roleCountBar } from '@/modules/ui/roleCount'  
// One generic list/create/edit/view/deactivate page, driven by modules/config/resources.js
export default function init() {
  const cfg = resources[window.USAMS.resource]
  const service = createResource(cfg.path)
  const inactiveValue = cfg.inactiveValue ?? 'INACTIVE'
  const isDelete = cfg.removeMode === 'delete'
  const hasActions = cfg.readOnly ? !!cfg.rowLink : true
  const canRemove = (row) => isDelete || (cfg.removeMode === 'deactivate' && row.status && row.status !== inactiveValue)

  const panel = qs('[data-panel]')
  const filtersBox = qs('[data-role="filters"]', panel)
  const tableBox = qs('[data-role="table"]', panel)
  const pagerBox = qs('[data-role="pager"]', panel)

    // "User Accounts: 50 [All v]" bar, only for pages whose config sets roleCount
  // const roleCount = cfg.roleCount ? roleCountBar({ path: cfg.path }) : null
  // if (roleCount) panel.before(roleCount.el)

  const roleCount = cfg.roleCount ? roleCountBar({ path: cfg.path }) : null
  if (roleCount) panel.before(roleCount.el)

  const list = createResourceList(service, { onChange: render })

  // ---- create / edit ----
  // const openFormFor = (row) => formDialog({
  //   title: t(row ? 'Edit {item}' : 'Add {item}', { item: tl(cfg.singular) }),
  //   fields: cfg.fields,
  //   initial: row,
  //   onSubmit: (payload) => (row ? service.update(row.id, payload) : service.create(payload)),
  //   onSaved: () => {
  //     toast.success(t(row ? '{item} updated' : '{item} created', { item: tc(cfg.singular) }))
  //     list.load()
  //   },
  // })
    const openFormFor = (row) => formDialog({
    title: t(row ? 'Edit {item}' : 'Add {item}', { item: tl(cfg.singular) }),
    fields: cfg.fields,
    initial: row,
    onSubmit: (payload) => (row ? service.update(row.id, payload) : service.create(payload)),
    onSaved: () => {
      toast.success(t(row ? '{item} updated' : '{item} created', { item: tc(cfg.singular) }))
      roleCount?.refresh()
      list.load()
    },
  })

  // ---- deactivate / delete ----
  const askRemove = (row) => confirmDialog({
    title: t(isDelete ? 'Delete this {item}?' : 'Deactivate this {item}?', { item: tl(cfg.singular) }),
    message: isDelete ? 'This cannot be undone.' : 'It will be marked inactive. Existing records are kept.',
    confirmLabel: isDelete ? 'Delete' : 'Deactivate',
    danger: true,
    onConfirm: async () => {
      try {
        if (isDelete) await service.remove(row.id)
        else await service.patch(row.id, { status: inactiveValue })
        toast.success(t(isDelete ? '{item} deleted' : '{item} deactivated', { item: tc(cfg.singular) }))
        list.load()
      } catch (e) {
        toast.error(t(isDelete ? 'Could not delete {item}' : 'Could not deactivate {item}', { item: tl(cfg.singular) }), e.message)
        throw e // keep the dialog open
      }
    },
  })

  const iconButton = (name, label, onclick, extra = '') =>
    el('button', { class: `btn rs-icon${extra}`, type: 'button', 'aria-label': label, title: label, onclick }, icon(name))

  const rowActions = (row) => {
    if (cfg.rowLink) {
      return el('a', { class: 'btn', href: url(cfg.rowLink(row)) }, t(cfg.rowLinkLabel ?? 'Open'), icon('arrow-right'))
    }
    const item = { item: tl(cfg.singular) }
    return [
      iconButton('eye', t('View {item}', item), () => detailDialog({ title: t('{item} details', { item: tc(cfg.singular) }), item: row, columns: cfg.columns, related: cfg.related })),
      cfg.canEdit ? iconButton('pencil', t('Edit {item}', item), () => openFormFor(row)) : null,
      canRemove(row) ? iconButton('slash-circle', t(isDelete ? 'Delete {item}' : 'Deactivate {item}', item), () => askRemove(row), ' rs-danger') : null,
    ]
  }

  // ---- layout ----
  const addLabel = t('Add {item}', { item: tl(cfg.singular) })
  if (cfg.canCreate) {
    qs('.ph-actions').append(el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openFormFor(null) }, icon('plus-lg'), addLabel))
  }
  filtersBox.append(searchAndFilterBar({
    filters: cfg.filters ?? [],
    showSearch: cfg.showSearch !== false,
    placeholder: cfg.searchPlaceholder ?? 'Search',
    onSearch: list.setSearch,
    onFilter: list.setFilter,
  }))

  function render(state) {
    const filtered = state.query.search || Object.values(state.query.filters).some(Boolean)
    renderDataTable(tableBox, {
      columns: cfg.columns,
      rows: state.items,
      loading: state.loading,
      error: state.error,
      emptyTitle: t('No {items} found', { items: tl(cfg.title) }),
      emptyText: filtered ? t('Try a different search or clear the filters.') : cfg.canCreate ? t('Add the first {item} to get started.', { item: tl(cfg.singular) }) : '',
      emptyAction: cfg.canCreate && !state.query.search ? el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openFormFor(null) }, icon('plus-lg'), addLabel) : null,
      actions: hasActions ? rowActions : null,
      onRetry: list.load,
    })
    renderPagination(pagerBox, { ...state.meta, onChange: list.setPage })
  }

  list.load()
}
