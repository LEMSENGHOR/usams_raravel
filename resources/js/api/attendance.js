// import api from './client'
// import { normalizeList } from './resource'

// const unwrap = (body) => body?.data ?? body

// /**
//  * Session workflow for a given base path (lecturer or admin scope).
//  * Expected (verify in Phase 8):
//  *   GET  {base}/{id}          -> session { status, session_date, start_time, end_time, class, subject, lecturer }
//  *   GET  {base}/{id}/records  -> [{ student:{id,student_code,name}, record:null | {status,check_in_time,note} }]
//  *   PUT  {base}/{id}/records  -> body { records:[{student_id,status,note?}] }
//  *   POST {base}/{id}/open | close | cancel
//  */
// export function sessionApi(base) {
//   return {
//     get: async (id) => unwrap(await api.get(`${base}/${id}`)),
//     records: async (id) => normalizeList(await api.get(`${base}/${id}/records`, { per_page: 500 })).items,
//     saveRecords: async (id, records) => unwrap(await api.put(`${base}/${id}/records`, { records })),
//     open: (id) => api.post(`${base}/${id}/open`),
//     close: (id) => api.post(`${base}/${id}/close`),
//     cancel: (id) => api.post(`${base}/${id}/cancel`),
//   }
// }


import api from './client'
import { normalizeList } from './resource'

const unwrap = (body) => body?.data ?? body

/**
 * Attendance session API
 *
 * GET   /{base}/{id}
 * GET   /{base}/{id}/students
 * PATCH /{base}/{id}/records/{record}
 * POST  /{base}/{id}/open
 * POST  /{base}/{id}/close
 * POST  /{base}/{id}/cancel
 */
export function sessionApi(base) {
  return {
    get: async (id) => unwrap(await api.get(`${base}/${id}`)),

    records: async (id) =>
      normalizeList(
        await api.get(`${base}/${id}/students`, { per_page: 500 })
      ).items,

    saveRecords: async (id, records) => {
      return Promise.all(
        records.map((record) =>
          api.patch(`${base}/${id}/records/${record.record_id}`, {
            status: record.status,
            ...(record.note !== undefined ? { note: record.note } : {}),
          })
        )
      )
    },

    open: (id) => api.post(`${base}/${id}/open`),
    close: (id) => api.post(`${base}/${id}/close`),
    cancel: (id) => api.post(`${base}/${id}/cancel`),
  }
}
