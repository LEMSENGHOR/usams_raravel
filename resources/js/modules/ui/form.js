import { el } from "@/modules/utils/dom";
import { icon } from "./icon";
import { openModal } from "./dialog";
import { t } from "@/modules/i18n";
import { getPath, toDateInput, toTimeInput } from "@/modules/utils/helpers";
import { staticOptions, loadRemoteOptions } from "@/api/options";

function coerce(field, v) {
    if (v == null)
        return field.default ?? (field.type === "checkbox" ? false : "");
    if (field.type === "date") return toDateInput(v);
    if (field.type === "time") return toTimeInput(v);
    return v;
}

/**
 * One form control with its label, help text and error line (replaces FormField.vue).
 * Returns { root, get(), setError(message) }. Selects hand back the option's ORIGINAL value (number or string),
 * so request payloads keep the same types the Vue app sent.
 */
function createField(field, initialValue) {
    const id = `f-${field.key}`;
    const error = el("span", { class: "field-error", hidden: true });
    const help = field.help
        ? el("span", { class: "ff-help" }, t(field.help))
        : null;
    let input;
    let get;
    let label;

    if (field.type === "checkbox") {
        input = el("input", { id, type: "checkbox" });
        input.checked = !!initialValue;
        get = () => input.checked;
        const root = el(
            "div",
            { class: "field check" },
            el("label", { class: "ff-row" }, input, " ", t(field.label)),
            help,
            error,
        );
        return finish(root);
    }

    label = el(
        "label",
        { for: id },
        t(field.label),
        field.required ? el("span", { "aria-hidden": "true" }, " *") : null,
    );

    if (field.type === "select") {
        let options = [];
        input = el(
            "select",
            { id, class: "input" },
            el("option", { value: "" }, t("Select…")),
        );
        const fill = (list) => {
            options = list;
            input.replaceChildren(
                el("option", { value: "" }, t("Select…")),
                ...list.map((o) =>
                    el(
                        "option",
                        { value: String(o.value) },
                        o.i18n ? t(o.label) : o.label,
                    ),
                ),
            );
            input.value =
                initialValue === "" || initialValue == null
                    ? ""
                    : String(initialValue);
        };
        const fixed = staticOptions(field);
        if (fixed) fill(fixed);
        else if (field.remote) {
            input.disabled = true;
            input.firstChild.textContent = t("Loading…");
            loadRemoteOptions(field)
                .then(fill)
                .catch(() => {
                    input.firstChild.textContent = t("Could not load options");
                })
                .finally(() => {
                    input.disabled = false;
                });
        }
        get = () => {
            const match = options.find((o) => String(o.value) === input.value);
            return match ? match.value : input.value;
        };
    } else if (field.type === "textarea") {
        input = el("textarea", { id, class: "input ff-area", rows: 3 });
        input.value = initialValue;
        get = () => input.value;
    } else {
        input = el("input", {
            id,
            class: "input",
            type: field.type ?? "text",
            autocomplete: field.type === "password" ? "new-password" : "off",
            min: field.min,
        });
        input.value = initialValue;
        get = () => input.value;
    }

    return finish(el("div", { class: "field" }, label, input, help, error));

    function finish(root) {
        return {
            root,
            get,
            setError(message) {
                error.textContent = message ? t(message) : "";
                error.hidden = !message;
                if (message) input.setAttribute("aria-invalid", "true");
                else input.removeAttribute("aria-invalid");
            },
        };
    }
}

/**
 * Create / edit dialog (replaces FormDialog.vue).
 * onSubmit(payload) is async and should throw the normalized API error; 422 field errors are shown under the fields.
 */
export function formDialog({
    title,
    fields,
    initial = null,
    submitLabel = "Save",
    onSubmit,
    onSaved = () => {},
}) {
    const mode = initial ? "edit" : "create";
    const visible = fields.filter((f) => !f.only || f.only === mode);
    const controls = visible.map((f) => ({
        field: f,
        ctl: createField(
            f,
            coerce(f, initial ? getPath(initial, f.key) : undefined),
        ),
    }));

    const bannerText = el("span");
    const banner = el(
        "div",
        { class: "fd-banner", role: "alert", hidden: true },
        icon("exclamation-triangle", 18),
        bannerText,
    );
    const cancelBtn = el(
        "button",
        { class: "btn", type: "button" },
        t("Cancel"),
    );
    const submitBtn = el(
        "button",
        { class: "btn btn-primary", type: "submit" },
        t(submitLabel),
    );
    const form = el(
        "form",
        { class: "fd-dialog card", novalidate: true },
        el(
            "header",
            { class: "fd-head" },
            el("h2", { id: "fd-title" }, t(title)),
            el(
                "button",
                {
                    class: "fd-x",
                    type: "button",
                    "aria-label": t("Close"),
                    onclick: () => dialog.close(),
                },
                icon("x-lg", 18),
            ),
        ),
        el(
            "div",
            { class: "fd-body" },
            banner,
            controls.map((c) => c.ctl.root),
        ),
        el("footer", { class: "fd-foot" }, cancelBtn, submitBtn),
    );
    const dialog = el(
        "dialog",
        { class: "fd-backdrop", "aria-labelledby": "fd-title" },
        form,
    );
    cancelBtn.addEventListener("click", () => dialog.close());

    const setBusy = (busy) => {
        cancelBtn.disabled = submitBtn.disabled = busy;
        submitBtn.replaceChildren(
            ...(busy
                ? [icon("arrow-repeat", 16, "fd-spin"), t("Saving…")]
                : [t(submitLabel)]),
        );
    };
    const showBanner = (text) => {
        bannerText.textContent = text;
        banner.hidden = !text;
    };

    // function payload() {
    //   const out = {}
    //   for (const { field: f, ctl } of controls) {
    //     let v = ctl.get()
    //     if (f.type === 'number') v = v === '' ? null : Number(v)
    //     else if (v === '') v = f.required ? v : null
    //     if (f.type === 'password' && initial && !v) continue // keep existing password
    //     out[f.key] = v
    //   }
    //   return out
    // }

    function payload() {
        const out = {};

        for (const { field: f, ctl } of controls) {
            let v = ctl.get();
            if (f.type === "number") v = v === "" ? null : Number(v);
            else if (v === "") v = f.required ? v : null;
            if (f.type === "password" && initial && !v) continue;
            out[f.key] = v;
        }

        console.log("Timetable payload:", out);
        console.log("day_of_week type:", typeof out.day_of_week);

        return out;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showBanner("");
        controls.forEach((c) => c.ctl.setError(""));
        let ok = true;
        for (const { field: f, ctl } of controls) {
            const v = ctl.get();
            const empty = v === "" || v == null;
            if (f.required && empty && !(f.type === "password" && initial)) {
                ctl.setError(t("This field is required."));
                ok = false;
            }
        }
        if (!ok) return;

        setBusy(true);
        try {
            await onSubmit(payload());
            setBusy(false);
            dialog.close();
            onSaved();
        } catch (err) {
            const known = new Map(controls.map((c) => [c.field.key, c.ctl]));
            const extra = [];
            for (const [k, msgs] of Object.entries(err.fieldErrors ?? {})) {
                if (known.has(k)) known.get(k).setError(msgs[0]);
                else extra.push(msgs[0]);
            }
            showBanner(
                extra.length
                    ? extra.join(" ")
                    : Object.keys(err.fieldErrors ?? {}).length
                      ? t("Fix the highlighted fields.")
                      : (err.message ?? t("Could not save. Try again.")),
            );
            setBusy(false);
        }
    });

    openModal(dialog);
    return { dialog };
}
