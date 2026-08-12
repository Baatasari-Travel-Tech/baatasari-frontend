// Shared schema + helpers for the dynamic multi-step recruitment form builder.

export type RecruitmentFieldType =
  | "short_text"
  | "paragraph"
  | "single_choice"
  | "multi_choice"
  | "dropdown"
  | "link"

export type RecruitmentField = {
  id: string
  type: RecruitmentFieldType
  label: string
  required: boolean
  options?: string[]
  /** For the "link" display block — the URL the label points to. */
  url?: string
}

export type RecruitmentStep = {
  id: string
  title: string
  fields: RecruitmentField[]
}

export type RecruitmentForm = {
  steps: RecruitmentStep[]
}

export const FIELD_TYPES: {
  type: RecruitmentFieldType
  label: string
  hasOptions: boolean
}[] = [
  { type: "short_text", label: "Short answer", hasOptions: false },
  { type: "paragraph", label: "Paragraph", hasOptions: false },
  { type: "single_choice", label: "Single choice", hasOptions: true },
  { type: "multi_choice", label: "Checkboxes", hasOptions: true },
  { type: "dropdown", label: "Dropdown", hasOptions: true },
  { type: "link", label: "Link", hasOptions: false },
]

/** Display-only block types (not answered by the applicant). */
export function isDisplayField(type: RecruitmentFieldType): boolean {
  return type === "link"
}

/**
 * Returns the URL only if it's a safe http(s) link, otherwise null.
 * "link" block URLs are typed by admins and rendered as a clickable href, so
 * an unchecked `javascript:`/`data:` URI would execute in a visitor's origin
 * (stored XSS). Validate the scheme both when saving and before rendering.
 */
export function safeLinkUrl(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim()
  if (!raw) return null
  try {
    // Resolved against the current origin so protocol-relative ("//evil") and
    // path URLs are interpreted the same way the browser would.
    const parsed = new URL(raw, typeof window !== "undefined" ? window.location.origin : "https://x")
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? raw : null
  } catch {
    return null
  }
}

export function fieldTypeMeta(type: RecruitmentFieldType) {
  return FIELD_TYPES.find((t) => t.type === type) ?? FIELD_TYPES[0]
}

export function uid(prefix = "f"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function emptyForm(): RecruitmentForm {
  return { steps: [{ id: uid("s"), title: "Step 1", fields: [] }] }
}

export function newField(type: RecruitmentFieldType): RecruitmentField {
  const hasOptions = fieldTypeMeta(type).hasOptions
  return {
    id: uid(),
    type,
    label: "",
    required: false,
    ...(hasOptions ? { options: ["Option 1"] } : {}),
    ...(type === "link" ? { url: "" } : {}),
  }
}

export function countFields(form?: RecruitmentForm | null): number {
  return form?.steps?.reduce((n, s) => n + s.fields.length, 0) ?? 0
}

/** Normalise whatever the backend returned into a usable form. */
export function coerceForm(form: RecruitmentForm | null | undefined): RecruitmentForm {
  if (form && Array.isArray(form.steps) && form.steps.length > 0) return form
  return emptyForm()
}

export function validateForm(f: RecruitmentForm): string | null {
  if (countFields(f) === 0) return "Add at least one question."
  for (const s of f.steps) {
    for (const fl of s.fields) {
      if (!fl.label.trim()) return "Every question needs a label."
      if (fieldTypeMeta(fl.type).hasOptions && (fl.options ?? []).filter((o) => o.trim()).length < 1)
        return `"${fl.label || "A choice question"}" needs at least one option.`
    }
  }
  return null
}
