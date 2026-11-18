import { endpoints } from "./endpoints";
/**
 * Declarative definitions for list/create/edit/view pages. Field names and relation
 * shapes (e.g. row.faculty.name) are ASSUMPTIONS to verify in Phase 8 (see docs/API_MAP.md).
 */
const col = (key, label, extra = {}) => ({ key, label, ...extra });
const R = (path, label = "name", params) => ({ path, label, params });
const ACTIVE = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
];
const ACADEMIC = [
    { value: "UPCOMING", label: "Upcoming" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
];
const SESSION = ["SCHEDULED", "OPEN", "CLOSED", "CANCELLED"].map((v) => ({
    value: v,
    label: v.charAt(0) + v.slice(1).toLowerCase(),
}));
const ATTENDANCE = ["PRESENT", "LATE", "ABSENT", "EXCUSED"].map((v) => ({
    value: v,
    label: v.charAt(0) + v.slice(1).toLowerCase(),
}));
const ROLES = ["SUPER_ADMIN", "ADMIN", "LECTURER", "STUDENT"].map((v) => ({
    value: v,
    label: v
        .replace("_", " ")
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase()),
}));
const ACCOUNT = ["ACTIVE", "INACTIVE", "SUSPENDED"].map((v) => ({
    value: v,
    label: v.charAt(0) + v.slice(1).toLowerCase(),
}));
const statusField = (options = ACTIVE) => ({
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    options,
    default: options[0].value,
});
const statusCol = col("status", "Status", { type: "badge" });
const sel = (key, label, remote, extra = {}) => ({
    key,
    label,
    type: "select",
    required: true,
    remote,
    ...extra,
});
const assignmentLabel = (a) =>
    [a.class?.name, a.subject?.name, a.semester?.name]
        .filter(Boolean)
        .join(" · ") || `#${a.id}`;

export const resources = {
    faculties: {
        title: "Faculties",
        singular: "faculty",
        path: endpoints.faculties,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by code or name",
        filters: [{ key: "status", label: "Statuses", options: ACTIVE }],
        columns: [
            col("code", "Code"),
            col("name", "Name"),
            col("description", "Description"),
            statusCol,
        ],
        fields: [
            { key: "code", label: "Faculty code", required: true },
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description", type: "textarea" },
            statusField(),
        ],
    },
    departments: {
        title: "Departments",
        singular: "department",
        path: endpoints.departments,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by code or name",
        filters: [
            {
                key: "faculty_id",
                label: "Faculties",
                remote: R(endpoints.faculties),
            },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("code", "Code"),
            col("name", "Name"),
            col("faculty.name", "Faculty"),
            statusCol,
        ],
        fields: [
            sel("faculty_id", "Faculty", R(endpoints.faculties)),
            { key: "code", label: "Department code", required: true },
            { key: "name", label: "Name", required: true },
            statusField(),
        ],
    },
    majors: {
        title: "Majors",
        singular: "major",
        path: endpoints.majors,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by code or name",
        filters: [
            {
                key: "department_id",
                label: "Departments",
                remote: R(endpoints.departments),
            },
            { key: "degree_level", label: "Degree level", type: "text" },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("code", "Code"),
            col("name", "Name"),
            col("department.name", "Department"),
            col("degree_level", "Degree level"),
            col("duration_years", "Duration (years)"),
            statusCol,
        ],
        fields: [
            sel("department_id", "Department", R(endpoints.departments)),
            { key: "code", label: "Major code", required: true },
            { key: "name", label: "Name", required: true },
            { key: "degree_level", label: "Degree level", required: true },
            {
                key: "duration_years",
                label: "Duration (years)",
                type: "number",
                min: 1,
            },
            statusField(),
        ],
    },
    "academic-years": {
        title: "Academic Years",
        singular: "academic year",
        path: endpoints["academic-years"],
        canCreate: true,
        canEdit: true,
        removeMode: null,
        searchPlaceholder: "Search by name",
        filters: [{ key: "status", label: "Statuses", options: ACADEMIC }],
        columns: [
            col("name", "Academic year"),
            col("start_date", "Starts", { type: "date" }),
            col("end_date", "Ends", { type: "date" }),
            col("is_current", "Current", {
                type: "bool",
                trueLabel: "Current",
            }),
            statusCol,
        ],
        fields: [
            {
                key: "name",
                label: "Name",
                required: true,
                help: "For example 2026-2027",
            },
            {
                key: "start_date",
                label: "Start date",
                type: "date",
                required: true,
            },
            {
                key: "end_date",
                label: "End date",
                type: "date",
                required: true,
            },
            statusField(ACADEMIC),
            {
                key: "is_current",
                label: "Mark as the current academic year",
                type: "checkbox",
            },
        ],
    },
    semesters: {
        title: "Semesters",
        singular: "semester",
        path: endpoints.semesters,
        canCreate: true,
        canEdit: true,
        removeMode: null,
        searchPlaceholder: "Search by name",
        filters: [
            {
                key: "academic_year_id",
                label: "Academic years",
                remote: R(endpoints["academic-years"]),
            },
            { key: "status", label: "Statuses", options: ACADEMIC },
        ],
        columns: [
            col("name", "Semester"),
            col("academic_year.name", "Academic year"),
            col("start_date", "Starts", { type: "date" }),
            col("end_date", "Ends", { type: "date" }),
            statusCol,
        ],
        fields: [
            sel(
                "academic_year_id",
                "Academic year",
                R(endpoints["academic-years"]),
            ),
            { key: "name", label: "Name", required: true },
            {
                key: "start_date",
                label: "Start date",
                type: "date",
                required: true,
            },
            {
                key: "end_date",
                label: "End date",
                type: "date",
                required: true,
            },
            statusField(ACADEMIC),
        ],
    },
    // students: {
    //   title: 'Students', singular: 'student', path: endpoints.students, canCreate: true, canEdit: true, removeMode: 'deactivate',
    //   searchPlaceholder: 'Search by name, code or email',
    //   filters: [{ key: 'major_id', label: 'Majors', remote: R(endpoints.majors) }, { key: 'status', label: 'Statuses', options: ACTIVE }],
    //   columns: [col('student_code', 'Student code'), col('name', 'Name'), col('email', 'Email'), col('major.name', 'Major'), col('admission_date', 'Admitted', { type: 'date' }), statusCol],
    //   fields: [
    //     { key: 'student_code', label: 'Student code', required: true }, { key: 'name', label: 'Full name', required: true }, { key: 'email', label: 'Email', type: 'email', required: true },
    //     sel('major_id', 'Major', R(endpoints.majors)), { key: 'admission_date', label: 'Admission date', type: 'date', required: true },
    //     { key: 'user_id', label: 'Linked user account', type: 'select', remote: R(endpoints.users, 'email', { role: 'STUDENT' }), help: 'Optional. The login account for this student.' }, statusField(),
    //   ],
    //   related: { title: 'Enrollments', path: endpoints.enrollments, param: 'student_id', columns: [col('class.name', 'Class'), col('academic_year.name', 'Academic year'), col('enrollment_date', 'Enrolled', { type: 'date' }), col('status', 'Status', { type: 'badge' })] },
    // },

    students: {
        title: "Students",
        singular: "student",
        path: endpoints.students,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",

        searchPlaceholder: "Search by name, code or email",

        filters: [
            { key: "major_id", label: "Majors", remote: R(endpoints.majors) },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],

        columns: [
            col("student_code", "Student code"),
            col("full_name", "Full name"),
            col("email", "Email"),
            col("major.name", "Major"),
            col("admission_date", "Admitted", { type: "date" }),
            statusCol,
        ],

        fields: [
            {
                key: "student_code",
                label: "Student code",
                required: true,
            },
            {
                key: "full_name",
                label: "Full name",
                required: true,
            },
            {
                key: "email",
                label: "Email",
                type: "email",
                required: true,
            },
            {
                key: "password",
                label: "Password",
                type: "password",
                required: true,
                only: "create",
                help: "Create a password for the student login account.",
            },
            {
                key: "password",
                label: "New password",
                type: "password",
                only: "edit",
                help: "Leave blank to keep the current password.",
            },
            sel("major_id", "Major", R(endpoints.majors)),
            {
                key: "admission_date",
                label: "Admission date",
                type: "date",
                required: true,
            },
            statusField(),
        ],

        related: {
            title: "Enrollments",
            path: endpoints.enrollments,
            param: "student_id",
            columns: [
                col("class.name", "Class"),
                col("academic_year.name", "Academic year"),
                col("enrollment_date", "Enrolled", { type: "date" }),
                col("status", "Status", { type: "badge" }),
            ],
        },
    },

    lecturers: {
        title: "Lecturers",
        singular: "lecturer",
        path: endpoints.lecturers,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by name, code or email",
        filters: [
            {
                key: "department_id",
                label: "Departments",
                remote: R(endpoints.departments),
            },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("lecturer_code", "Lecturer code"),
            col("name", "Name"),
            col("email", "Email"),
            col("department.name", "Department"),
            col("academic_title", "Academic title"),
            statusCol,
        ],
        fields: [
            { key: "lecturer_code", label: "Lecturer code", required: true },
            { key: "name", label: "Full name", required: true },
            { key: "email", label: "Email", type: "email", required: true },
            sel("department_id", "Department", R(endpoints.departments)),
            { key: "academic_title", label: "Academic title" },
            {
                key: "user_id",
                label: "Linked user account",
                type: "select",
                remote: R(endpoints.users, "email", { role: "LECTURER" }),
                help: "Optional. The login account for this lecturer.",
            },
            statusField(),
        ],
        related: {
            title: "Teaching assignments",
            path: endpoints.assignments,
            param: "lecturer_id",
            columns: [
                col("class.name", "Class"),
                col("subject.name", "Subject"),
                col("semester.name", "Semester"),
                col("room", "Room"),
            ],
        },
    },
    classes: {
        title: "Classes",
        singular: "class",
        path: endpoints.classes,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by code or name",
        filters: [
            { key: "major_id", label: "Majors", remote: R(endpoints.majors) },
            {
                key: "academic_year_id",
                label: "Academic years",
                remote: R(endpoints["academic-years"]),
            },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("code", "Class code"),
            col("name", "Class name"),
            col("year_level", "Year"),
            col("group", "Group"),
            col("major.name", "Major"),
            col("academic_year.name", "Academic year"),
            statusCol,
        ],
//         columns: [
//     col("code", "Class code"),
//     col("name", "Class name"),
//     col("year_level", "Year"),
//     col("group", "Group"),
//     col("major.name", "Major"),
//     col("academic_year.name", "Academic year"),
//     statusCol,
// ],
        fields: [
            { key: "code", label: "Class code", required: true },
            { key: "name", label: "Class name", required: true },
            {
                key: "year_level",
                label: "Year level",
                type: "number",
                min: 1,
                required: true,
            },
            { key: "group", label: "Group" },
            sel("major_id", "Major", R(endpoints.majors)),
            sel(
                "academic_year_id",
                "Academic year",
                R(endpoints["academic-years"]),
            ),
            statusField(),
        ],
        related: {
            title: "Enrolled students",
            path: endpoints.enrollments,
            param: "class_id",
            columns: [
                col("student.student_code", "Code"),
                col("student.name", "Student"),
                col("status", "Status", { type: "badge" }),
            ],
        },
    },
    subjects: {
        title: "Subjects",
        singular: "subject",
        path: endpoints.subjects,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by code or name",
        filters: [
            {
                key: "department_id",
                label: "Departments",
                remote: R(endpoints.departments),
            },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("code", "Code"),
            col("name", "Name"),
            col("department.name", "Department"),
            col("credits", "Credits"),
            statusCol,
        ],
        fields: [
            { key: "code", label: "Subject code", required: true },
            { key: "name", label: "Name", required: true },
            sel("department_id", "Department", R(endpoints.departments)),
            {
                key: "credits",
                label: "Credits",
                type: "number",
                min: 0,
                required: true,
            },
            statusField(),
        ],
    },
    assignments: {
        title: "Class-Subject Assignments",
        singular: "assignment",
        path: endpoints.assignments,
        canCreate: true,
        canEdit: true,
        removeMode: "deactivate",
        searchPlaceholder: "Search by class, subject or lecturer",
        filters: [
            { key: "class_id", label: "Classes", remote: R(endpoints.classes) },
            {
                key: "semester_id",
                label: "Semesters",
                remote: R(endpoints.semesters),
            },
            {
                key: "lecturer_id",
                label: "Lecturers",
                remote: R(endpoints.lecturers),
            },
            { key: "status", label: "Statuses", options: ACTIVE },
        ],
        columns: [
            col("class.name", "Class"),
            col("subject.name", "Subject"),
            col("lecturer.name", "Lecturer"),
            col("semester.name", "Semester"),
            col("room", "Room"),
            statusCol,
        ],
        fields: [
            sel("class_id", "Class", R(endpoints.classes)),
            sel("subject_id", "Subject", R(endpoints.subjects)),
            sel("semester_id", "Semester", R(endpoints.semesters)),
            sel("lecturer_id", "Lecturer", R(endpoints.lecturers)),
            { key: "room", label: "Room" },
            statusField(),
        ],
    },
    enrollments: {
        title: "Enrollments",
        singular: "enrollment",
        path: endpoints.enrollments,
        canCreate: true,
        canEdit: true,
        removeMode: null,
        searchPlaceholder: "Search by student name or code",
        filters: [
            { key: "class_id", label: "Classes", remote: R(endpoints.classes) },
            {
                key: "academic_year_id",
                label: "Academic years",
                remote: R(endpoints["academic-years"]),
            },
            { key: "status", label: "Status", type: "text" },
        ],
        columns: [
            col("student.student_code", "Student code"),
            col("student.full_name", "Student"),
            col("class.name", "Class"),
            col("academic_year.name", "Academic year"),
            col("created_at", "Enrolled",
              { type: "date" }),
            statusCol,
        ],
       
        fields: [
            sel(
                "student_id",
                "Student",
                R(endpoints.students, (s) =>
                    `${s.student_code ?? ""} ${s.name ?? ""}`.trim(),
                ),
            ),
            sel("class_id", "Class", R(endpoints.classes)),
            sel(
                "academic_year_id",
                "Academic year",
                R(endpoints["academic-years"]),
            ),
            {
                key: "enrollment_date",
                label: "Enrollment date",
                type: "date",
                required: true,
            },
        ],
    },
    users: {
        title: "User Accounts",
        singular: "user account",
        path: endpoints.users,
        canCreate: true,
        canEdit: true,
        removeMode: null,
        roleCount: true,
        searchPlaceholder: "Search by name or email",
        filters: [
            { key: "role", label: "Roles", options: ROLES },
            { key: "status", label: "Statuses", options: ACCOUNT },
        ],
        columns: [
            col("name", "Name"),
            col("email", "Email"),
            col("role", "Role", { type: "badge" }),
            statusCol,
        ],
        fields: [
            { key: "name", label: "Name", required: true },
            { key: "email", label: "Email", type: "email", required: true },
            {
                key: "role",
                label: "Role",
                type: "select",
                required: true,
                options: ROLES,
            },
            statusField(ACCOUNT),
            {
                key: "password",
                label: "Password",
                type: "password",
                required: true,
                only: "create",
            },
            {
                key: "password",
                label: "New password",
                type: "password",
                only: "edit",
                help: "Leave blank to keep the current password.",
            },
        ],
    },
    adminSessions: {
        title: "Attendance Sessions",
        singular: "session",
        path: endpoints["attendance-sessions"],
        readOnly: true,
        rowLink: (r) => `/admin/attendance/sessions/${r.id}`,
        rowLinkLabel: "View records",
        filters: [
            { key: "session_date", label: "Session date", type: "date" },
            { key: "class_id", label: "Classes", remote: R(endpoints.classes) },
            {
                key: "lecturer_id",
                label: "Lecturers",
                remote: R(endpoints.lecturers),
            },
            { key: "status", label: "Statuses", options: SESSION },
        ],
        showSearch: false,
        // columns: [
        //     col("session_date", "Date", { type: "date" }),
        //     col("class.name", "Class"),
        //     col("subject.name", "Subject"),
        //     col("lecturer.name", "Lecturer"),
        //     col("start_time", "Starts", { type: "time" }),
        //     col("end_time", "Ends", { type: "time" }),
        //     statusCol,
        // ],
        columns: [
    col("session_date", "Date", { type: "date" }),
    col("class_subject.class.name", "Class"),
    col("class_subject.subject.name", "Subject"),
    col("class_subject.lecturer.name", "Lecturer"),
    col("start_time", "Starts", { type: "time" }),
    col("end_time", "Ends", { type: "time" }),
    statusCol,
],
    },
    adminRecords: {
        title: "Attendance Records",
        singular: "record",
        path: endpoints["attendance-records"],
        readOnly: true,
        filters: [
            { key: "status", label: "Statuses", options: ATTENDANCE },
            { key: "date_from", label: "From date", type: "date" },
            { key: "date_to", label: "To date", type: "date" },
        ],
        searchPlaceholder: "Search by student name or code",
        columns: [
            col("session.session_date", "Date", { type: "date" }),
            col("session.class.name", "Class"),
            col("session.subject.name", "Subject"),
            col("student.student_code", "Student code"),
            col("student.name", "Student"),
            col("session.lecturer.name", "Lecturer"),
            statusCol,
        ],
    },
    lecturerClasses: {
        title: "My Classes",
        singular: "class",
        path: endpoints.lecturer.assignments,
        readOnly: true,
        rowLink: (r) => `/lecturer/classes/${r.id}`,
        rowLinkLabel: "Open class",
        searchPlaceholder: "Search by class or subject",
        columns: [
            col("class.name", "Class"),
            col("subject.name", "Subject"),
            col("semester.name", "Semester"),
            col("room", "Room"),
            statusCol,
        ],
    },
    lecturerSubjects: {
        title: "My Subjects",
        singular: "subject",
        path: endpoints.lecturer.assignments,
        readOnly: true,
        rowLink: (r) => `/lecturer/classes/${r.id}`,
        rowLinkLabel: "Open class",
        searchPlaceholder: "Search by subject or class",
        columns: [
            col("subject.code", "Code"),
            col("subject.name", "Subject"),
            col("subject.credits", "Credits"),
            col("class.name", "Class"),
            col("semester.name", "Semester"),
        ],
    },
    lecturerHistory: {
        title: "Attendance History",
        singular: "session",
        path: endpoints.lecturer.sessions,
        readOnly: true,
        showSearch: false,
        rowLink: (r) => `/lecturer/attendance/sessions/${r.id}`,
        rowLinkLabel: "View records",
        filters: [
            {
                key: "class_subject_id",
                label: "Classes and subjects",
                remote: {
                    path: endpoints.lecturer.assignments,
                    label: assignmentLabel,
                },
            },
            { key: "date_from", label: "From date", type: "date" },
            { key: "date_to", label: "To date", type: "date" },
            { key: "status", label: "Statuses", options: SESSION },
        ],
        columns: [
            col("session_date", "Date", { type: "date" }),
            col("class.name", "Class"),
            col("subject.name", "Subject"),
            col("start_time", "Starts", { type: "time" }),
            col("end_time", "Ends", { type: "time" }),
            statusCol,
        ],
    },
};

export { assignmentLabel, SESSION, ATTENDANCE };
