"use client"

import { useState } from "react"
import {
  FIELD_TYPES,
  fieldTypeMeta,
  newField,
  uid,
  type RecruitmentField,
  type RecruitmentFieldType,
  type RecruitmentForm,
} from "@/lib/recruitment"

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-brand-900 outline-none transition-all focus:border-(--royal-blue) focus:ring-4 focus:ring-(--royal-blue)/10 disabled:opacity-60"
const BTN_GHOST =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-(--gold-soft-border) hover:bg-(--gold-soft-bg) disabled:opacity-50"

/**
 * Reusable multi-step form builder. The parent owns the form state and save;
 * this just edits it and calls onChange.
 */
export function FormBuilder({
  form,
  onChange,
  editable = true,
}: {
  form: RecruitmentForm
  onChange: (f: RecruitmentForm) => void
  editable?: boolean
}) {
  const [active, setActive] = useState(0)
  const step = form.steps[active] ?? form.steps[0]

  function updateStep(stepId: string, updater: (s: RecruitmentForm["steps"][number]) => RecruitmentForm["steps"][number]) {
    onChange({ ...form, steps: form.steps.map((s) => (s.id === stepId ? updater(s) : s)) })
  }
  function updateField(stepId: string, fieldId: string, patch: Partial<RecruitmentField>) {
    updateStep(stepId, (s) => ({ ...s, fields: s.fields.map((fl) => (fl.id === fieldId ? { ...fl, ...patch } : fl)) }))
  }
  function addField(stepId: string, type: RecruitmentFieldType) {
    updateStep(stepId, (s) => ({ ...s, fields: [...s.fields, newField(type)] }))
  }
  function removeField(stepId: string, fieldId: string) {
    updateStep(stepId, (s) => ({ ...s, fields: s.fields.filter((fl) => fl.id !== fieldId) }))
  }
  function moveField(stepId: string, idx: number, dir: -1 | 1) {
    updateStep(stepId, (s) => {
      const fields = [...s.fields]
      const j = idx + dir
      if (j < 0 || j >= fields.length) return s
      ;[fields[idx], fields[j]] = [fields[j], fields[idx]]
      return { ...s, fields }
    })
  }
  function changeType(stepId: string, field: RecruitmentField, type: RecruitmentFieldType) {
    const wantsOptions = fieldTypeMeta(type).hasOptions
    updateField(stepId, field.id, {
      type,
      options: wantsOptions ? field.options ?? ["Option 1"] : undefined,
      url: type === "link" ? field.url ?? "" : undefined,
    })
  }
  function setOption(stepId: string, field: RecruitmentField, i: number, val: string) {
    updateField(stepId, field.id, { options: (field.options ?? []).map((o, idx) => (idx === i ? val : o)) })
  }
  function addOption(stepId: string, field: RecruitmentField) {
    updateField(stepId, field.id, { options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] })
  }
  function removeOption(stepId: string, field: RecruitmentField, i: number) {
    updateField(stepId, field.id, { options: (field.options ?? []).filter((_, idx) => idx !== i) })
  }
  function addStep() {
    const next = { ...form, steps: [...form.steps, { id: uid("s"), title: `Step ${form.steps.length + 1}`, fields: [] }] }
    onChange(next)
    setActive(next.steps.length - 1)
  }
  function removeStep(stepId: string) {
    if (form.steps.length <= 1) return
    const steps = form.steps.filter((s) => s.id !== stepId)
    setActive((a) => Math.min(a, steps.length - 1))
    onChange({ ...form, steps })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Steps</p>
        {form.steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              active === i
                ? "border-(--gold) bg-(--gold-soft-bg) font-semibold text-brand-900"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <span className="truncate">{s.title || `Step ${i + 1}`}</span>
            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-xs text-slate-500">{s.fields.length}</span>
          </button>
        ))}
        <button onClick={addStep} disabled={!editable} className={`${BTN_GHOST} w-full`}>
          + Add step
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            value={step.title}
            disabled={!editable}
            onChange={(e) => updateStep(step.id, (s) => ({ ...s, title: e.target.value }))}
            placeholder="Step title"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-bricolage text-base font-semibold text-brand-900 outline-none focus:ring-4 focus:ring-(--royal-blue)/10 disabled:opacity-60"
          />
          {form.steps.length > 1 && editable && (
            <button
              onClick={() => removeStep(step.id)}
              title="Delete step"
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-rose-600 transition-colors hover:bg-rose-50"
            >
              ✕
            </button>
          )}
        </div>

        {step.fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-400">
            Nothing in this step yet.
          </div>
        ) : (
          step.fields.map((field, idx) => (
            <FieldCard
              key={field.id}
              field={field}
              index={idx}
              total={step.fields.length}
              editable={editable}
              onLabel={(v) => updateField(step.id, field.id, { label: v })}
              onUrl={(v) => updateField(step.id, field.id, { url: v })}
              onType={(t) => changeType(step.id, field, t)}
              onRequired={(v) => updateField(step.id, field.id, { required: v })}
              onMove={(dir) => moveField(step.id, idx, dir)}
              onRemove={() => removeField(step.id, field.id)}
              onOption={(i, v) => setOption(step.id, field, i, v)}
              onAddOption={() => addOption(step.id, field)}
              onRemoveOption={(i) => removeOption(step.id, field, i)}
            />
          ))
        )}

        {editable && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Add a block</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((ft) => (
                <button
                  key={ft.type}
                  onClick={() => addField(step.id, ft.type)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-brand-900 transition-colors hover:border-(--royal-blue)/30 hover:bg-(--royal-blue)/5"
                >
                  + {ft.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldCard({
  field,
  index,
  total,
  editable,
  onLabel,
  onUrl,
  onType,
  onRequired,
  onMove,
  onRemove,
  onOption,
  onAddOption,
  onRemoveOption,
}: {
  field: RecruitmentField
  index: number
  total: number
  editable: boolean
  onLabel: (v: string) => void
  onUrl: (v: string) => void
  onType: (t: RecruitmentFieldType) => void
  onRequired: (v: boolean) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onOption: (i: number, v: string) => void
  onAddOption: () => void
  onRemoveOption: (i: number) => void
}) {
  const meta = fieldTypeMeta(field.type)
  const isLink = field.type === "link"
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--gold-soft-bg) px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-(--gold-text)">
          {meta.label}
        </span>
        {editable && (
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(-1)} disabled={index === 0} title="Move up" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30">
              ↑
            </button>
            <button onClick={() => onMove(1)} disabled={index === total - 1} title="Move down" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30">
              ↓
            </button>
            <button onClick={onRemove} title="Delete" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-rose-600 hover:bg-rose-50">
              ✕
            </button>
          </div>
        )}
      </div>

      <input
        value={field.label}
        disabled={!editable}
        onChange={(e) => onLabel(e.target.value)}
        placeholder={isLink ? "Link text (e.g. Join WhatsApp group)" : "Question label"}
        className={INPUT}
      />

      {isLink ? (
        <input value={field.url ?? ""} disabled={!editable} onChange={(e) => onUrl(e.target.value)} placeholder="https://chat.whatsapp.com/…" className={`${INPUT} mt-3`} />
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={field.type}
            disabled={!editable}
            onChange={(e) => onType(e.target.value as RecruitmentFieldType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none disabled:opacity-60"
          >
            {FIELD_TYPES.filter((t) => t.type !== "link").map((ft) => (
              <option key={ft.type} value={ft.type}>
                {ft.label}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={field.required} disabled={!editable} onChange={(e) => onRequired(e.target.checked)} className="h-4 w-4 accent-(--royal-blue)" />
            Required
          </label>
        </div>
      )}

      {meta.hasOptions && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                disabled={!editable}
                onChange={(e) => onOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none disabled:opacity-60"
              />
              {editable && (field.options?.length ?? 0) > 1 && (
                <button onClick={() => onRemoveOption(i)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-rose-600 hover:bg-rose-50">
                  ✕
                </button>
              )}
            </div>
          ))}
          {editable && (
            <button onClick={onAddOption} className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-(--royal-blue) hover:underline">
              + Add option
            </button>
          )}
        </div>
      )}
    </div>
  )
}
