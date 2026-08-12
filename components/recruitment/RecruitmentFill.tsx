"use client"

import { useState } from "react"
import { isDisplayField, safeLinkUrl, type RecruitmentField, type RecruitmentForm } from "@/lib/recruitment"

type Values = Record<string, string | string[]>

/**
 * Renders a multi-step recruitment form for an applicant to fill in. Calls
 * onSubmit with a flat [{ question, answer }] list (the shape the backend
 * stores and exports).
 */
export function RecruitmentFill({
  form,
  submitting,
  onSubmit,
}: {
  form: RecruitmentForm
  submitting: boolean
  onSubmit: (answers: { question: string; answer: string }[]) => void
}) {
  const steps = form.steps.filter((s) => s.fields.length > 0)
  const [stepIdx, setStepIdx] = useState(0)
  const [values, setValues] = useState<Values>({})
  const [error, setError] = useState<string | null>(null)

  if (steps.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">This form has no questions yet.</p>
  }

  const step = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1

  function setVal(id: string, v: string | string[]) {
    setValues((p) => ({ ...p, [id]: v }))
  }

  function stepValid(): boolean {
    for (const f of step.fields) {
      if (!f.required) continue
      const v = values[f.id]
      if (f.type === "multi_choice") {
        if (!Array.isArray(v) || v.length === 0) return false
      } else if (!v || (typeof v === "string" && !v.trim())) {
        return false
      }
    }
    return true
  }

  function advance() {
    setError(null)
    if (!stepValid()) {
      setError("Please answer all required questions.")
      return
    }
    if (!isLast) {
      setStepIdx((i) => i + 1)
      return
    }
    const answers = steps.flatMap((s) =>
      s.fields
        .filter((f) => !isDisplayField(f.type))
        .map((f) => {
          const v = values[f.id]
          return { question: f.label, answer: Array.isArray(v) ? v.join(", ") : (v ?? "") }
        }),
    )
    onSubmit(answers)
  }

  return (
    <div className="space-y-5">
      {steps.length > 1 && (
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIdx ? "bg-(--gold)" : "bg-slate-200"}`}
            />
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-(--gold-text)">
          Step {stepIdx + 1} of {steps.length}
        </p>
        <h3 className="mt-0.5 font-bricolage text-lg font-semibold text-brand-900">{step.title}</h3>
      </div>

      <div className="space-y-4">
        {step.fields.map((field) => (
          <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(v) => setVal(field.id, v)} />
        ))}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex gap-2.5 pt-1">
        {stepIdx > 0 && (
          <button
            type="button"
            onClick={() => setStepIdx((i) => i - 1)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-slate-50"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={advance}
          disabled={submitting}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-900 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--brand-navy)_18%,transparent)] transition-all hover:bg-(--brand-navy-hover) disabled:opacity-60"
        >
          {submitting ? "Submitting…" : isLast ? "Submit application" : "Continue"}
        </button>
      </div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RecruitmentField
  value: string | string[] | undefined
  onChange: (v: string | string[]) => void
}) {
  const label = (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {field.label}
      {field.required && <span className="text-rose-600"> *</span>}
    </label>
  )
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-brand-900 outline-none transition-all focus:border-(--royal-blue) focus:ring-4 focus:ring-(--royal-blue)/10"
  const opts = field.options ?? []

  if (field.type === "link") {
    // Only render a real link for safe http(s) URLs; anything else (e.g. a
    // javascript:/data: URI an admin may have entered) renders as inert text.
    const safeUrl = safeLinkUrl(field.url)
    const blockCls =
      "flex items-center gap-2.5 rounded-xl border border-(--gold-soft-border) bg-(--gold-soft-bg) px-3.5 py-2.5 text-sm font-semibold text-brand-900 transition-colors hover:border-(--gold)"
    if (!safeUrl) {
      return <span className={blockCls}>{field.label}</span>
    }
    return (
      <a href={safeUrl} target="_blank" rel="noopener noreferrer" className={blockCls}>
        <span className="flex-1">{field.label}</span>
        <span className="text-(--gold-icon)">↗</span>
      </a>
    )
  }

  if (field.type === "short_text") {
    return (
      <div>
        {label}
        <input className={inputCls} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" />
      </div>
    )
  }
  if (field.type === "paragraph") {
    return (
      <div>
        {label}
        <textarea rows={3} className={`${inputCls} resize-none`} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Your answer" />
      </div>
    )
  }
  if (field.type === "dropdown") {
    return (
      <div>
        {label}
        <select className={inputCls} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Select…
          </option>
          {opts.map((o, i) => (
            <option key={i} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    )
  }
  if (field.type === "single_choice") {
    const v = (value as string) ?? ""
    return (
      <div>
        {label}
        <div className="space-y-2">
          {opts.map((o, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${v === o ? "border-(--royal-blue) bg-(--royal-blue)/5 text-brand-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
            >
              <input type="radio" name={field.id} checked={v === o} onChange={() => onChange(o)} className="h-4 w-4 accent-(--royal-blue)" />
              {o}
            </label>
          ))}
        </div>
      </div>
    )
  }
  // multi_choice
  const arr = Array.isArray(value) ? value : []
  function toggle(o: string) {
    onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])
  }
  return (
    <div>
      {label}
      <div className="space-y-2">
        {opts.map((o, i) => {
          const checked = arr.includes(o)
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${checked ? "border-(--royal-blue) bg-(--royal-blue)/5 text-brand-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(o)} className="h-4 w-4 accent-(--royal-blue)" />
              {o}
            </label>
          )
        })}
      </div>
    </div>
  )
}
