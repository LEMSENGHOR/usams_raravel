# USAMS Backend API Reference

University Student Attendance Management System. Laravel 12, MySQL 8, Sanctum bearer tokens.
This document describes the endpoints implemented in Phases 4 to 8. It reflects the code, so if code and document ever disagree, the code wins and this file needs updating.

## 1. Conventions

| Item | Value |
|---|---|
| Base URL (local) | `http://127.0.0.1:8000/api` |
| Format | JSON in, JSON out |
| Required headers | `Accept: application/json` on every request, `Content-Type: application/json` when sending a body |
| Authentication | `Authorization: Bearer <token>` (token from `POST /auth/login`) |
| Dates | `YYYY-MM-DD` |
| Times | `HH:MM` (24 hour) |

### Roles

| Name used below | Who |
|---|---|
| **Public** | no token |
| **Any** | any authenticated user whose account `status` is `ACTIVE` |
| **Admin** | `ADMIN` or `SUPER_ADMIN` |
| **Staff** | `LECTURER`, `ADMIN` or `SUPER_ADMIN` |
| **Owner** | the lecturer assigned to the session's class-subject (admins also pass) |

### Response shapes

Single resource: `{ "data": { ... } }`

Paginated list: `{ "data": [ ... ], "links": { ... }, "meta": { "current_page", "per_page", "total", "last_page", ... } }`

Action result or error: `{ "success": true|false, "message": "..." }`

Validation error (422): `{ "message": "...", "errors": { "field": ["..."] } }`

Every list accepts `per_page` (default 15, maximum 100) and most accept `q` (text search).

### Status codes

| Code | Meaning |
|---|---|
| 200 / 201 | success / created |
| 401 | missing, invalid or revoked token, or wrong credentials |
| 403 | authenticated but not allowed (role, ownership, inactive account) |
| 404 | resource not found, or a record that does not belong to the session in the URL |
| 409 | conflict: duplicate, still referenced, or wrong state (for example session already closed) |
| 422 | validation failed |
| 429 | too many login attempts (5 per minute) |

---

## 2. Authentication

### POST /auth/login
Public. Throttled to 5 attempts per minute per IP.

Body

```json
{ "email": "admin@example.com", "password": "secret", "device_name": "vue-app" }
```

Rules: `email` required, valid e-mail, max 255. `password` required, max 255. `device_name` optional, max 100.

200

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "1|abcdef...",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "Admin", "email": "admin@example.com", "role": "ADMIN", "status": "ACTIVE", "student": null, "lecturer": null }
  }
}
```

Errors: 401 `Invalid credentials.` (same message for unknown e-mail and wrong password), 403 `This account is not active.`, 422 validation, 429 throttled.

### POST /auth/logout
Any. Revokes only the token used for this request. 200 `{ "success": true, "message": "Logged out." }`

### GET /auth/me
Any. 200 `{ "success": true, "data": { user, student|lecturer profile } }`. The password hash and tokens are never returned.

### GET /admin/ping
Admin. Temporary route used to test role middleware. 200 `{ "success": true, "message": "pong" }`. Remove it before production.

---

## 3. Reference data

Read endpoints (`GET`) are open to **Any**. Write endpoints (`POST`, `PATCH`/`PUT`, `DELETE`) are **Admin** only. A write by another role returns 403.

Each resource has the same five operations:

| Method | URL | Purpose |
|---|---|---|
| GET | `/{resource}` | paginated list with filters |
| GET | `/{resource}/{id}` | details |
| POST | `/{resource}` | create (201) |
| PATCH or PUT | `/{resource}/{id}` | update; on PATCH only the fields sent are validated and changed |
| DELETE | `/{resource}/{id}` | delete; 409 when the record is still referenced |

| Resource | List filters | Create fields and rules | Deleting is refused (409) while it has |
|---|---|---|---|
| `faculties` | `q` (code, name) | `code` required, max 20, unique. `name` required, max 255 | departments |
| `departments` | `q`, `faculty_id` | `faculty_id` exists. `code` max 20 unique. `name` | majors, subjects, lecturers |
| `majors` | `q`, `department_id` | `department_id` exists. `code` max 20 unique. `name` | students, classes |
| `academic-years` | `q`, `is_current` | `name` max 20 unique. `start_date`, `end_date` (end after start). `is_current` optional boolean | semesters, classes, enrollments |
| `semesters` | `q`, `academic_year_id` | `academic_year_id` exists. `name` max 50, unique within the year. `start_date`, `end_date` inside the academic year, end after start | class-subject assignments |
| `classes` | `q`, `major_id`, `academic_year_id` | `major_id`, `academic_year_id` exist. `code` max 30, unique per major and year. `name` | class-subjects, enrollments |
| `subjects` | `q`, `department_id` | `department_id` exists. `code` max 20 unique. `name`. `credits` optional integer 1 to 10 | class-subjects |

Notes

- Setting `is_current: true` on an academic year switches every other year to `false` in the same transaction.
- Routes use these URL names: `/faculties`, `/departments`, `/majors`, `/academic-years`, `/semesters`, `/classes`, `/subjects`.

Example: `POST /faculties`

```json
{ "code": "FST", "name": "Faculty of Science" }
```

201 `{ "data": { "id": 1, "code": "FST", "name": "Faculty of Science", "created_at": "...", "updated_at": "..." } }`

422 `{ "message": "The code has already been taken.", "errors": { "code": ["The code has already been taken."] } }`

409 (delete) `{ "success": false, "message": "Cannot delete: this faculty still has departments." }`

---

## 4. People

### Students: `/students` (Admin only, all operations)

| Method | URL |
|---|---|
| GET | `/students?q=&major_id=&per_page=` |
| GET | `/students/{id}` |
| POST | `/students` |
| PATCH or PUT | `/students/{id}` |
| DELETE | `/students/{id}` |

Create body

```json
{
  "major_id": 1, "student_code": "S001", "full_name": "Sok Dara",
  "gender": "MALE", "date_of_birth": "2004-05-10",
  "email": "dara@example.com", "password": "password123", "status": "ACTIVE"
}
```

Rules: `major_id` exists. `student_code` max 30 unique. `full_name` max 255. `gender` optional `MALE|FEMALE|OTHER`. `date_of_birth` optional, before today. `email` unique among users. `password` min 8. `status` optional `ACTIVE|INACTIVE|SUSPENDED`.

The user account and the student profile are created in one transaction. The role is always `STUDENT`; a `role` field in the request is ignored. 201 returns the profile with `account: { email, role, status }`.

Delete: refused with 409 when the student has enrollments or attendance. Set `status` to `INACTIVE` instead.

### Lecturers: `/lecturers` (Admin only)

Same operations as students. Body: `department_id`, `lecturer_code` (max 30, unique), `full_name`, `email`, `password`, optional `status`. Role is always `LECTURER`. Delete is refused (409) while the lecturer has class-subject assignments.

---

## 5. Assignments, enrollments and timetables

Reads are scoped to the caller. Writes are Admin only.

| Resource | Admin sees | Lecturer sees | Student sees |
|---|---|---|---|
| `class-subjects` | all | own assignments | assignments of classes they are actively enrolled in |
| `enrollments` | all | enrollments of classes they teach | own enrollments |
| `timetables` | all | timetables of own assignments | timetables of their classes |

`GET /{resource}/{id}` for a row outside the caller's scope returns 403.

### class-subjects

`POST /class-subjects` body `{ "class_id", "subject_id", "lecturer_id", "semester_id" }`, all required and existing. The semester must belong to the class's academic year (422 otherwise). The same class, subject and semester twice returns 409. `PATCH` accepts only `lecturer_id`; the other three fields are rejected. Filters: `class_id`, `subject_id`, `lecturer_id`, `semester_id`. Delete is refused (409) while timetables or attendance sessions exist.

### enrollments

`POST /enrollments` body `{ "student_id", "class_id" }`. `academic_year_id` is derived from the class on the server and `status` starts as `ACTIVE`. A duplicate returns 409. `PATCH` body `{ "status": "ACTIVE|DROPPED|COMPLETED" }`. Filters: `class_id`, `student_id`, `academic_year_id`, `status`. Delete is refused (409) once attendance exists; use `DROPPED`.

### timetables

`POST /timetables` body

```json
{ "class_subject_id": 1, "day_of_week": 1, "start_time": "08:00", "end_time": "10:00", "room": "A101" }
```

Rules: `day_of_week` 1 (Monday) to 7. `end_time` after `start_time`. The slot must not overlap another slot on the same day for the same class or the same lecturer (422 on `start_time`). Back-to-back slots are allowed. Filters: `class_subject_id`, `day_of_week`.

---

## 6. Attendance sessions

All routes under `/attendance-sessions` require **Staff**. Students receive 403. A lecturer can only act on sessions of their own class-subjects (403 otherwise); admins can act on any.

State machine

```
SCHEDULED --open--> OPEN --close--> CLOSED
    |
    +--cancel--> CANCELLED
```

Attendance statuses: `PENDING`, `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`.

| Method | URL | Purpose |
|---|---|---|
| GET | `/attendance-sessions` | list (scoped). Filters: `class_subject_id`, `status`, `date_from`, `date_to`, `per_page` |
| POST | `/attendance-sessions` | create a SCHEDULED session |
| GET | `/attendance-sessions/{session}` | details with `summary` counts |
| POST | `/attendance-sessions/{session}/open` | SCHEDULED to OPEN and create the PENDING roster |
| POST | `/attendance-sessions/{session}/initialize` | idempotently add records for students enrolled after opening |
| GET | `/attendance-sessions/{session}/students` | roster. Filters: `status`, `per_page` (default 50, max 200) |
| PATCH | `/attendance-sessions/{session}/records/{record}` | mark or correct one student |
| POST | `/attendance-sessions/{session}/close` | OPEN to CLOSED; PENDING becomes ABSENT |
| POST | `/attendance-sessions/{session}/cancel` | SCHEDULED to CANCELLED |
| GET | `/attendance-sessions/{session}/audit-logs` | change history. Filters: `attendance_record_id`, `per_page` |

### POST /attendance-sessions

```json
{ "class_subject_id": 1, "timetable_id": null, "session_date": "2026-10-05", "start_time": "08:00", "end_time": "10:00" }
```

Rules: `class_subject_id` exists and must be assigned to the caller (admins: any). `timetable_id` optional and must belong to that class-subject. `session_date` inside the class-subject's semester (422 on `session_date`). `end_time` after `start_time`. `status`, `created_by` and similar fields in the body are ignored. A second non-cancelled session with the same class-subject, date and start time returns 409.

201 `{ "data": { "id": 1, "status": "SCHEDULED", "session_date": "2026-10-05", "start_time": "08:00", "end_time": "10:00", "created_by": 7, ... } }`

### POST /attendance-sessions/{session}/open

200

```json
{
  "data": { "id": 1, "status": "OPEN", "opened_at": "...", "summary": { "pending": 3, "present": 0, "absent": 0, "late": 0, "excused": 0, "total": 3 } },
  "records_created": 3
}
```

One PENDING record is created for every ACTIVE enrollment of the class. Dropped students get none. 409 if the session is not SCHEDULED.

### POST /attendance-sessions/{session}/initialize

Same response shape. `records_created` is 0 when nothing new was needed. Safe to retry. 409 if the session is not OPEN.

### PATCH /attendance-sessions/{session}/records/{record}

```json
{ "status": "EXCUSED", "note": "Medical certificate" }
```

```json
{ "status": "LATE", "reason": "Arrived after roll call" }
```

Rules

- `status` required, one of `PRESENT|ABSENT|LATE|EXCUSED`. `PENDING` is not accepted.
- `note` required when `status` is `EXCUSED`, max 500.
- `reason` max 500 and **required when changing a record that was already marked** (a correction).
- Sending the same status again changes nothing and writes no audit entry.
- The record must belong to the session in the URL, otherwise 404.
- Only OPEN sessions can be changed, otherwise 409.

Every change writes one audit entry (actor, old status, new status, reason, time).

### POST /attendance-sessions/{session}/close

200

```json
{ "data": { "status": "CLOSED", "closed_at": "...", "summary": { "pending": 0, "present": 0, "absent": 1, "late": 1, "excused": 1, "total": 3 } }, "auto_absent": 1 }
```

Remaining PENDING records become ABSENT, each with an audit entry, and the session closes, all in one transaction. 409 if the session is not OPEN.

### GET /attendance-sessions/{session}/audit-logs

```json
{ "data": [ { "id": 1, "attendance_record_id": 5, "attendance_session_id": 1, "actor": { "id": 7, "name": "Lecturer One" }, "old_status": "PENDING", "new_status": "PRESENT", "reason": null, "created_at": "..." } ], "links": {}, "meta": {} }
```

Audit entries cannot be updated or deleted through the application.

---

## 7. Student attendance history

### GET /students/{student}/attendance

| Caller | Access |
|---|---|
| Admin | any student |
| Student | only themselves (403 for others) |
| Lecturer | only that student's records inside the lecturer's own sessions |

Filters: `status`, `class_subject_id`, `date_from`, `date_to`, `per_page`.

200

```json
{
  "data": [ { "id": 5, "status": "LATE", "note": null, "session": { "session_date": "2026-10-05", "class_subject": { "subject": { "code": "CS101" } } } } ],
  "links": {}, "meta": {},
  "summary": { "pending": 0, "present": 0, "absent": 0, "late": 1, "excused": 0, "total": 1 }
}
```

`summary` covers every record that matches the filters, not only the current page.

---

## 8. Reports

Routes: `GET /attendance-reports` (JSON) and `GET /attendance-reports/export` (CSV). Role: **Staff**. Students get 403.

Visibility is enforced in SQL: admins see everything, a lecturer sees only records of their own class-subjects. Filters can narrow the data but never widen it. Only records of OPEN and CLOSED sessions are counted.

### Percentage formula

```
attendance_percentage = (PRESENT + LATE) / (PRESENT + LATE + ABSENT) x 100
```

`LATE` counts as attended. `EXCUSED` and `PENDING` are excluded from the denominator. The value is `null` when the denominator is 0. It is rounded to 2 decimals. JSON and CSV use the same formula.

### Parameters

| Parameter | Rules |
|---|---|
| `group_by` | required: `date`, `class`, `subject`, `student`, `lecturer`, `semester` |
| `date_from`, `date_to` | optional `YYYY-MM-DD`; `date_to` on or after `date_from` |
| `class_id`, `subject_id`, `lecturer_id`, `semester_id`, `student_id`, `class_subject_id` | optional integers |
| `per_page` | optional, default 25, max 100 (JSON only) |

### GET /attendance-reports

```
GET /api/attendance-reports?group_by=student&class_id=1&date_from=2026-09-01&date_to=2026-12-31
```

```json
{
  "data": [
    { "group_id": 1, "code": "S001", "label": "Sok Dara", "present": 10, "absent": 1, "late": 2, "excused": 1, "pending": 0, "total": 14, "attendance_percentage": 92.31 }
  ],
  "meta": { "current_page": 1, "per_page": 25, "total": 30, "last_page": 2 },
  "totals": { "group_id": null, "code": null, "label": null, "present": 10, "absent": 1, "late": 2, "excused": 1, "pending": 0, "total": 14, "attendance_percentage": 92.31 },
  "group_by": "student",
  "filters": { "class_id": "1", "date_from": "2026-09-01", "date_to": "2026-12-31" },
  "formula": "attendance_percentage = (PRESENT + LATE) / ..."
}
```

`code` and `label` by grouping: date (the date, the date), class (code, name), subject (code, name), student (student code, full name), lecturer (lecturer code, full name), semester (academic year name, semester name). `totals` covers all rows matching the filters, not just the current page.

### GET /attendance-reports/export

Same parameters except `per_page`. Returns `text/csv; charset=UTF-8` with a byte-order mark so Excel displays Khmer correctly. Columns: `group_by, code, label, present, absent, late, excused, pending, total, attendance_percentage`. Cells beginning with `=`, `+`, `-` or `@` are prefixed with `'` to prevent spreadsheet formula injection.

---

## 9. Known limits

- Administrators see all data. The schema does not link an admin to a department, so department-level admin scoping is not implemented.
- The duplicate-session check (same class-subject, date and start time) is enforced in application code, not by a database index.
- `is_current` is returned as `null` instead of `false` in the response to `POST /academic-years` when the field was not sent (the database value is `false`).
- Login throttling is per IP address. Behind a reverse proxy, configure trusted proxies so the real client IP is used.
