# មគ្គុទ្ទេសក៍តេស្ត USAMS API ជាមួយ Bruno

Collection នេះមាន **106 requests** និង **180 assertions** រត់តាមលំដាប់ដោយស្វ័យប្រវត្តិ។ វាតេស្តតាំងពី login, CRUD, សិទ្ធិតាម role, workflow វត្តមានពេញលេញ រហូតដល់ report និង CSV។

> ស្ថានភាពផ្ទៀងផ្ទាត់៖ ឯកសារ `.bru` ទាំងអស់ត្រូវបានផ្ទៀងផ្ទាត់ជាមួយ parser ផ្លូវការរបស់ Bruno (`@usebruno/lang`) ថា syntax ត្រឹមត្រូវ ហើយថា variable ទាំងអស់ត្រូវបានកំណត់មុនពេលប្រើ។ ប៉ុន្តែ **collection នេះមិនទាន់ត្រូវបានរត់ប្រឆាំងនឹង backend ពិតទេ** ព្រោះអ្នកដែលបង្កើតវាមិនអាចដំឡើង Laravel បាន។ ការរត់ដំបូងរបស់អ្នកគឺការតេស្តពិតដំបូងបំផុត។ បើមាន request ណាក្រហម សូមផ្ញើឈ្មោះ request និងសារ error មកខ្ញុំ។

## 1. ការប្រុងប្រយ័ត្នមុនរត់

1. **Backup database ជាមុន** (`mysqldump ... --result-file=D:\backups\usams_before_api_test.sql`)។
2. Collection នេះ **បង្កើតទិន្នន័យពិត** ក្នុង database (faculty, class, lecturer 2 នាក់, student 3 នាក់, session ...)។ វាមិនលុបទិន្នន័យចាស់ទេ ហើយប្រើ `runId` ថ្មីរាល់ពេលរត់ ដូច្នេះ code មិនជាន់គ្នា។ គួររត់លើ database សម្រាប់អភិវឌ្ឍន៍ មិនមែន database ផលិតកម្មទេ។ ចង់ឲ្យស្អាតវិញ សូម restore ពី backup។
3. Collection **មិនកំណត់ `is_current`** លើឆ្នាំសិក្សា ដើម្បីកុំឲ្យប្តូរឆ្នាំសិក្សាបច្ចុប្បន្នរបស់អ្នក។

## 2. ត្រៀមខ្លួន

```powershell
# ក្នុងថត project
php artisan route:list --path=api      # ត្រូវឃើញ routes ទាំងអស់
php artisan migrate:status             # migrations ត្រូវ Ran
```

បង្កើត admin ដំបូង (បើមិនទាន់មាន) តាម `php artisan tinker`៖

```php
$u = new App\Models\User(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'ជំនួសពាក្យសម្ងាត់ខ្លាំងមួយ']);
$u->role = 'ADMIN';
$u->status = 'ACTIVE';
$u->save();
```

ចាប់ផ្តើម server (terminal មួយទៀត)៖

```powershell
php artisan serve
```

## 3. នាំចូល collection

1. បើក Bruno → **Open Collection** → ជ្រើសថត `bruno` ក្នុង ZIP នេះ។
2. ជ្រើស environment **Local** (ជ្រុងខាងលើស្តាំ)។
3. បើក **Configure** របស់ environment ហើយបំពេញ `adminPassword` (ជាតម្លៃ secret មិនត្រូវបានរក្សាក្នុងឯកសារទេ)។ បើ admin របស់អ្នកមិនមែន `admin@example.com` សូមកែ `adminEmail`។
4. បើ backend មិនមែន `http://127.0.0.1:8000` សូមកែ `baseUrl`។

## 4. រត់

Right-click collection → **Run** (Runner)។ រំពឹងថា request ទាំង 106 ត្រឡប់ **ជាប់ទាំងអស់**។

- ការរត់ចំណាយពេលប្រហែល **1.5 នាទី** ព្រោះ request `Login with empty body` រង់ចាំ 61 វិនាទី ដើម្បីឲ្យ rate limit របស់ login (5 ដងក្នុង 1 នាទី) កំណត់ឡើងវិញ។
- **រង់ចាំយ៉ាងហោចណាស់ 1 នាទី** មុនរត់ម្តងទៀត បើមិនដូច្នេះ login ដំបូងនឹងបាន 429។
- សូមរត់ **ទាំង collection** តាមលំដាប់។ បើរត់ request តែមួយ variable ដូចជា `runId`, `facultyId` នឹងមិនទាន់មាន។

## 5. Collection តេស្តអ្វីខ្លះ

| Folder | តេស្ត |
|---|---|
| 00 Auth | login ជោគជ័យ, password ខុស (401), គ្មាន token (401), token មិនត្រឹមត្រូវ (401), password មិនលេចក្នុង response |
| 01 Reference data | CRUD, validation (422), ស្ទួន code (422), search, pagination, PATCH ផ្នែក, លុបដែលមាន child (409), កាលបរិច្ឆេទមិនត្រឹមត្រូវ |
| 02 People | បង្កើត lecturer/student ជាមួយ user, role ត្រូវបានបង្ខំ (ព្យាយាមបញ្ចូល `SUPER_ADMIN` ត្រូវបានមិនអើពើ), email ស្ទួន |
| 03 Assignments | class-subject, enrollment ស្ទួន (409), academic year ត្រូវបានយកពី class, timetable ជាន់ម៉ោង (422) |
| 04 Roles and visibility | lecturer/student មិនអាចសរសេរ (403), lecturer ឃើញតែទិន្នន័យខ្លួន, student ឃើញតែ enrollment ខ្លួន |
| 05 Attendance workflow | create/open/roster/mark/correct/close, idempotent initialize, PENDING → ABSENT ពេល close, audit logs, lecturer ផ្សេងមិនអាចប៉ះ (403), session បិទហើយមិនអាចកែ (409), ប្រវត្តិនិស្សិត |
| 06 Reports | totals និងភាគរយតាមរូបមន្ត, ទាំង 6 `group_by`, scope របស់ lecturer មិនលេចចេញ, 422, pagination, CSV |
| 90 Extras and cleanup | គណនី INACTIVE (token ចាស់ 403, login 403), លុប student ដែលមាន enrollment (409), logout និង token ត្រូវ revoke (401) |

តម្លៃរំពឹងទុកក្នុង workflow៖ student 1 → `LATE` (កែពី PRESENT), student 2 → `EXCUSED`, student 3 → `ABSENT` (ស្វ័យប្រវត្តិ)។ ដូច្នេះ report៖ present 0, late 1, excused 1, absent 1, total 3, ភាគរយ = (0+1) / (0+1+1) = **50%**។

## 6. បើមាន request ណាក្រហម

| រោគសញ្ញា | មូលហេតុទំនងជា | ដំណោះស្រាយ |
|---|---|---|
| `Login as admin` បាន 401 | `adminPassword`/`adminEmail` ខុស ឬ admin មិនទាន់មាន | ពិនិត្យ environment និងបង្កើត admin តាមជំហាន 2 |
| 401 ពី request ដំបូង ឬ 429 | រត់ម្តងទៀតក្នុងរយៈពេល 1 នាទី | រង់ចាំ 1 នាទី |
| 404 លើ route | `routes/api.php` មិនទាន់ជំនួស ឬ `php artisan route:clear` | `php artisan route:list --path=api` |
| 500 | error ក្នុង server | មើល `storage/logs/laravel.log` បន្ទាត់ចុងក្រោយ ហើយផ្ញើមកខ្ញុំ |
| 500 `Unknown column` / 422 `Data truncated` | schema ពិតខុសពីការសន្មត (ឈ្មោះ column ឬ ENUM គ្មាន `PENDING`) | ផ្ញើ `SHOW CREATE TABLE ...` ខ្ញុំនឹងកែ migration/code |
| `records_created` មិនស្មើ 3 | enrollment ចាស់ក្នុង class មាន | collection បង្កើត class ថ្មី ដូច្នេះមិនគួរកើតឡើង សូមផ្ញើលទ្ធផល |
| Request ក្រហមក្រោយ request ក្រហមមុន | ខ្សែសង្វាក់ (ID មិនត្រូវបានរក្សា) | ដោះស្រាយ request ក្រហមដំបូងមុនគេ |

**សំខាន់៖ ដោះស្រាយ request ក្រហមដំបូងគេមុន** ព្រោះ request ក្រោយៗច្រើនពឹងលើ ID ដែលវារក្សា។

## 7. ការផ្ទៀងផ្ទាត់បន្ថែមក្នុង MySQL (អានតែប៉ុណ្ណោះ)

```sql
-- unique index ការពារ record វត្តមានស្ទួន
SHOW INDEX FROM attendance_records WHERE Non_unique = 0;

-- សរុបវត្តមានតាម status (ជំនួសលេខ session ដោយលេខពិត)
SELECT status, COUNT(*) FROM attendance_records WHERE attendance_session_id = 1 GROUP BY status;

-- audit log របស់ session
SELECT * FROM attendance_audit_logs WHERE attendance_session_id = 1 ORDER BY id;
```

## 8. Postman

Bruno អាចនាំចូល/នាំចេញ Postman collection តាមម៉ឺនុយ import/export របស់វា (សូមពិនិត្យជំនាន់ Bruno របស់អ្នក)។ ឯកសារ `docs/API.md` មានព័ត៌មានគ្រប់ endpoint ដើម្បីបង្កើតដោយដៃក៏បាន។

## 9. ក្រោយ test ជាប់

- លុប route បណ្តោះអាសន្ន `GET /api/admin/ping` ពី `routes/api.php`។
- ទៅ Phase 11 (production readiness)។
