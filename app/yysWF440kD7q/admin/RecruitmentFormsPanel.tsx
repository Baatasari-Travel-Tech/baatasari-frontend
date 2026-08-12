"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api/client"
import type { ApiEnvelope } from "@/types/api"
import { FormBuilder } from "@/components/recruitment/FormBuilder"
import { coerceForm, validateForm, type RecruitmentForm as RecruitmentFormSchema } from "@/lib/recruitment"

type FormListItem = {
  id: string
  slug: string
  title: string
  published: boolean
  createdAt: string
  updatedAt: string
  submissionCount: number
}

type FormDetail = {
  id: string
  slug: string
  title: string
  schema: RecruitmentFormSchema
  published: boolean
  createdAt: string
  updatedAt: string
}

type SubmissionItem = {
  id: string
  createdAt: string
  answers: { question: string; answer: string }[]
}

const formsQueryKey = ["admin-recruitment-forms"]

type View = { type: "list" } | { type: "create" } | { type: "edit"; formId: string } | { type: "submissions"; formId: string }

export function RecruitmentFormsPanel() {
  const [view, setView] = useState<View>({ type: "list" })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recruitment forms</h2>
          <p className="mt-1 text-sm text-slate-500">Create forms, publish them, and review who applied.</p>
        </div>
        {view.type !== "list" && (
          <button
            onClick={() => setView({ type: "list" })}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back to forms
          </button>
        )}
      </div>

      <div className="mt-5">
        {view.type === "list" && <FormsList onCreate={() => setView({ type: "create" })} onEdit={(id) => setView({ type: "edit", formId: id })} onSubmissions={(id) => setView({ type: "submissions", formId: id })} />}
        {view.type === "create" && <CreateForm onCreated={(id) => setView({ type: "edit", formId: id })} />}
        {view.type === "edit" && <EditForm formId={view.formId} />}
        {view.type === "submissions" && <Submissions formId={view.formId} />}
      </div>
    </div>
  )
}

function FormsList({
  onCreate,
  onEdit,
  onSubmissions,
}: {
  onCreate: () => void
  onEdit: (id: string) => void
  onSubmissions: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formsQuery = useQuery({
    queryKey: formsQueryKey,
    queryFn: () => apiRequest<ApiEnvelope<{ forms: FormListItem[] }>>("/recruitment/admin/forms", { retryOn401: false }),
    retry: false,
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiRequest(`/recruitment/admin/forms/${id}/${publish ? "publish" : "unpublish"}`, { method: "POST", retryOn401: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formsQueryKey }),
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to update form."),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/recruitment/admin/forms/${id}`, { method: "DELETE", retryOn401: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formsQueryKey }),
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to delete form."),
  })

  const copyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/recruitment/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500)
  }

  const forms = formsQuery.data?.data.forms ?? []

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={onCreate} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
          + New form
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {formsQuery.isLoading ? (
        <p className="mt-5 text-sm text-slate-400">Loading…</p>
      ) : forms.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">No forms yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
          {forms.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-slate-900">{f.title}</p>
                <p className="text-sm text-slate-400">
                  /recruitment/{f.slug} · {f.submissionCount} submission{f.submissionCount === 1 ? "" : "s"} ·{" "}
                  <span className={f.published ? "text-emerald-600" : "text-slate-400"}>{f.published ? "Published" : "Draft"}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => onSubmissions(f.id)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Submissions
                </button>
                <button
                  onClick={() => onEdit(f.id)}
                  disabled={f.published}
                  title={f.published ? "Unpublish to edit" : undefined}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Edit
                </button>
                <button
                  onClick={() => publishMutation.mutate({ id: f.id, publish: !f.published })}
                  disabled={publishMutation.isPending}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {f.published ? "Unpublish" : "Publish"}
                </button>
                {f.published && (
                  <button onClick={() => copyLink(f.slug, f.id)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    {copiedId === f.id ? "Copied!" : "Copy link"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${f.title}"? This also deletes its submissions.`)) deleteMutation.mutate(f.id)
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded-xl border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const createSchema = z.object({
  title: z.string().min(1, "Required").max(200),
  slug: z
    .string()
    .min(1, "Required")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
})
type CreateValues = z.infer<typeof createSchema>

function CreateForm({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema), defaultValues: { title: "", slug: "" } })

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
      apiRequest<ApiEnvelope<{ form: FormDetail }>>("/recruitment/admin/forms", {
        method: "POST",
        body: JSON.stringify(values),
        retryOn401: false,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: formsQueryKey })
      onCreated(res.data.form.id)
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to create form."),
  })

  const onSubmit = form.handleSubmit((values) => {
    setError(null)
    createMutation.mutate(values)
  })

  return (
    <form className="max-w-md space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          placeholder="Design team recruitment"
          {...form.register("title")}
        />
        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.title?.message}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">URL slug</label>
        <div className="mt-1.5 flex items-center gap-1 text-sm text-slate-400">
          <span className="whitespace-nowrap">/recruitment/</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="design-team-2026"
            {...form.register("slug")}
          />
        </div>
        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.slug?.message}</p>
      </div>
      <button
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Creating…" : "Create form"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  )
}

function EditForm({ formId }: { formId: string }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<RecruitmentFormSchema | null>(null)
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formQuery = useQuery({
    queryKey: ["admin-recruitment-form", formId],
    queryFn: () => apiRequest<ApiEnvelope<{ form: FormDetail }>>(`/recruitment/admin/forms/${formId}`, { retryOn401: false }),
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (values: { title: string; schema: RecruitmentFormSchema }) =>
      apiRequest(`/recruitment/admin/forms/${formId}`, { method: "PATCH", body: JSON.stringify(values), retryOn401: false }),
    onSuccess: () => {
      setSuccess("Saved.")
      queryClient.invalidateQueries({ queryKey: ["admin-recruitment-form", formId] })
      queryClient.invalidateQueries({ queryKey: formsQueryKey })
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save."),
  })

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) =>
      apiRequest(`/recruitment/admin/forms/${formId}/${publish ? "publish" : "unpublish"}`, { method: "POST", retryOn401: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-recruitment-form", formId] })
      queryClient.invalidateQueries({ queryKey: formsQueryKey })
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to publish."),
  })

  if (formQuery.isLoading) return <p className="text-sm text-slate-400">Loading…</p>
  const loaded = formQuery.data?.data.form
  if (!loaded) return <p className="text-sm text-rose-600">Form not found.</p>

  const currentForm = draft ?? coerceForm(loaded.schema)
  const currentTitle = titleDraft ?? loaded.title
  const editable = !loaded.published

  const handleSave = () => {
    setError(null)
    setSuccess(null)
    const err = validateForm(currentForm)
    if (err) {
      setError(err)
      return
    }
    saveMutation.mutate({ title: currentTitle, schema: currentForm })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={currentTitle}
          disabled={!editable}
          onChange={(e) => setTitleDraft(e.target.value)}
          className="min-w-[16rem] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!editable || saveMutation.isPending}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => publishMutation.mutate(!loaded.published)}
            disabled={publishMutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loaded.published ? "Unpublish to edit" : "Publish"}
          </button>
        </div>
      </div>

      {loaded.published && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          This form is live at /recruitment/{loaded.slug}. Unpublish to make changes.
        </p>
      )}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <FormBuilder form={currentForm} onChange={setDraft} editable={editable} />
    </div>
  )
}

function Submissions({ formId }: { formId: string }) {
  const submissionsQuery = useQuery({
    queryKey: ["admin-recruitment-submissions", formId],
    queryFn: () =>
      apiRequest<ApiEnvelope<{ submissions: SubmissionItem[] }>>(`/recruitment/admin/forms/${formId}/submissions`, { retryOn401: false }),
    retry: false,
  })

  const submissions = submissionsQuery.data?.data.submissions ?? []
  const exportHref = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/recruitment/admin/forms/${formId}/submissions/export`

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{submissions.length} submission{submissions.length === 1 ? "" : "s"}</p>
        <a href={exportHref} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Export CSV
        </a>
      </div>

      {submissionsQuery.isLoading ? (
        <p className="mt-5 text-sm text-slate-400">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">No submissions yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()}</p>
              <dl className="mt-2 space-y-1.5">
                {s.answers.map((a, i) => (
                  <div key={i} className="text-sm">
                    <dt className="font-medium text-slate-700">{a.question}</dt>
                    <dd className="text-slate-600">{a.answer || "—"}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
