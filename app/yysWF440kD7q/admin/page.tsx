"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api/client"
import type { ApiEnvelope } from "@/types/api"
import { RecruitmentFormsPanel } from "./RecruitmentFormsPanel"
import { useAdminSession, meQueryKey, type Admin } from "./useAdminSession"

// Unguessable path, not linked anywhere in the app — this is the internal
// admin surface for tools we build here (recruitment forms, and whatever
// follows). Auth here is intentionally independent of the main site's User
// auth and of Admin-Backend's AdminUser auth — a separate cookie, a separate
// table.

const adminsQueryKey = ["admin-admins"]

const loginSchema = z.object({
  username: z.string().min(3, "Too short").max(100),
  password: z.string().min(8, "Too short").max(200),
})
type LoginValues = z.infer<typeof loginSchema>

const createAdminSchema = z.object({
  username: z.string().min(3, "Too short").max(100),
  password: z.string().min(8, "Too short").max(200),
})
type CreateAdminValues = z.infer<typeof createAdminSchema>

export default function AdminPage() {
  const meQuery = useAdminSession()

  if (meQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    )
  }

  const admin = meQuery.data?.data.admin ?? null

  return (
    <main className={`flex min-h-screen justify-center bg-slate-50 px-4 py-6 sm:py-12 ${admin ? "items-start" : "items-center"}`}>
      {admin ? <Dashboard admin={admin} /> : <LoginForm />}
    </main>
  )
}

function LoginForm() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) =>
      apiRequest<ApiEnvelope<{ admin: Admin }>>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
        retryOn401: false,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(meQueryKey, res)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setError(null)
    loginMutation.mutate(values)
  })

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to manage recruitment forms.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Username</label>
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            autoComplete="username"
            {...form.register("username")}
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.username?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <button
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  )
}

function Dashboard({ admin }: { admin: Admin }) {
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/admin/auth/logout", { method: "POST", retryOn401: false }),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: meQueryKey })
      queryClient.removeQueries({ queryKey: adminsQueryKey })
    },
  })

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-sm text-slate-500">Logged in as</p>
          <p className="text-lg font-semibold text-slate-900">
            {admin.username} <span className="text-sm font-normal text-slate-400">({admin.role})</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/yysWF440kD7q/admin/testing"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Testing
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>

      <RecruitmentFormsPanel />

      {admin.role === "SUPERADMIN" ? <AdminManagement /> : null}
    </div>
  )
}

function AdminManagement() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const form = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", password: "" },
  })

  const adminsQuery = useQuery({
    queryKey: adminsQueryKey,
    queryFn: () => apiRequest<ApiEnvelope<{ admins: Admin[] }>>("/admin/admins", { retryOn401: false }),
    retry: false,
  })

  const createAdminMutation = useMutation({
    mutationFn: (values: CreateAdminValues) =>
      apiRequest("/admin/admins", {
        method: "POST",
        body: JSON.stringify(values),
        retryOn401: false,
      }),
    onSuccess: (_res, values) => {
      setSuccess(`Admin "${values.username}" created.`)
      form.reset()
      queryClient.invalidateQueries({ queryKey: adminsQueryKey })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create admin.")
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setError(null)
    setSuccess(null)
    createAdminMutation.mutate(values)
  })

  const admins = adminsQuery.data?.data.admins ?? null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Admins</h2>
      <p className="mt-1 text-sm text-slate-500">Add another admin login for this tool.</p>

      <form className="mt-5 flex flex-wrap items-start gap-3" onSubmit={onSubmit}>
        <div className="min-w-[10rem] flex-1">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Username"
            autoComplete="off"
            {...form.register("username")}
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.username?.message}</p>
        </div>
        <div className="min-w-[10rem] flex-1">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
        </div>
        <button
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={createAdminMutation.isPending}
        >
          {createAdminMutation.isPending ? "Adding…" : "Add admin"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

      <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
        {admins === null ? (
          <li className="py-3 text-sm text-slate-400">Loading…</li>
        ) : admins.length === 0 ? (
          <li className="py-3 text-sm text-slate-400">No admins yet.</li>
        ) : (
          admins.map((a) => <AdminRow key={a.id} admin={a} />)
        )}
      </ul>
    </div>
  )
}

const changePasswordSchema = z.object({
  password: z.string().min(8, "Too short").max(200),
})
type ChangePasswordValues = z.infer<typeof changePasswordSchema>

function AdminRow({ admin }: { admin: Admin }) {
  const queryClient = useQueryClient()
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "" },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      apiRequest(`/admin/admins/${admin.id}/password`, {
        method: "PATCH",
        body: JSON.stringify(values),
        retryOn401: false,
      }),
    onSuccess: () => {
      setChangingPassword(false)
      form.reset()
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to change password."),
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/admin/admins/${admin.id}`, { method: "DELETE", retryOn401: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminsQueryKey }),
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to delete admin."),
  })

  const onSubmit = form.handleSubmit((values) => {
    setError(null)
    changePasswordMutation.mutate(values)
  })

  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium text-slate-800">{admin.username}</span>{" "}
          <span className="text-slate-400">({admin.role})</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setError(null)
              setChangingPassword((v) => !v)
            }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Change password
          </button>
          <button
            onClick={() => {
              setError(null)
              if (window.confirm(`Delete admin "${admin.username}"?`)) deleteMutation.mutate()
            }}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      {changingPassword && (
        <form className="mt-3 flex flex-wrap items-start gap-2" onSubmit={onSubmit}>
          <div className="min-w-[10rem] flex-1">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              type="password"
              placeholder="New password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.password?.message}</p>
          </div>
          <button
            className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </li>
  )
}
