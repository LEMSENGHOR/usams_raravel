import { localeTag, t } from "@/modules/i18n";
import { DAYS } from "@/modules/config/endpoints";

const firstFilled = (...values) =>
    values.find(
        (v) => v !== undefined && v !== null && String(v).trim() !== "",
    );

/** Best available display name for a student, lecturer or user, whichever fields the API sends. */
export const personName = (p) =>
    firstFilled(
        p?.name,
        p?.user?.name,
        p?.full_name,
        [p?.first_name, p?.last_name].filter(Boolean).join(" "),
        p?.student_code,
        p?.lecturer_code,
        p?.email,
        p?.user?.email,
    ) ?? "—";

/** Class and subject names of a session, whether the API nests them directly or under class_subject. */
export const sessionClass = (s) =>
    firstFilled(
        s?.class?.name,
        s?.class_subject?.class?.name,
        s?.classSubject?.class?.name,
        s?.class_name,
        s?.class?.code,
        s?.class_subject?.class?.code,
    ) ?? "—";
export const sessionSubject = (s) =>
    firstFilled(
        s?.subject?.name,
        s?.class_subject?.subject?.name,
        s?.classSubject?.subject?.name,
        s?.subject_name,
    ) ?? "—";

/** Sort comparator: newest first by created_at (or session_date), then by id. */
export const newestFirst = (a, b) =>
    String(b?.created_at ?? b?.session_date ?? "").localeCompare(
        String(a?.created_at ?? a?.session_date ?? ""),
    ) || Number(b?.id) - Number(a?.id);

export const getPath = (obj, path) =>
    path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

export function fmtDate(v) {
    if (!v) return "—";
    const s = String(v);
    // Plain dates ("2026-10-27") must not be parsed as UTC or they can shift a day.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
    return isNaN(d)
        ? s
        : d.toLocaleDateString(localeTag(), {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

export const fmtTime = (v) => (v ? String(v).slice(0, 5) : "—");
export const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
export const toTimeInput = (v) => (v ? String(v).slice(0, 5) : "");
export const fmtPercent = (v) =>
    v == null || v === "" || isNaN(Number(v))
        ? "—"
        : `${Number(v).toFixed(1)}%`;
export const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** 'MONDAY' -> 'Monday' / Khmer; unknown values pass through. */
export const dayLabel = (v) => {
    const d = DAYS.find((x) => x.value === String(v).toUpperCase());
    return d ? t(d.label) : (v ?? "—");
};

/** Prefix a path with the app's base path (needed when Laravel runs in a sub-folder, e.g. /usams/public). */
export const url = (path) => (window.USAMS?.base ?? "") + path;
