"use client"

import Link from "next/link"
import { useAdminSession } from "../useAdminSession"
import { CanvasBuilder } from "@/components/testing/CanvasBuilder"

export default function TestingPage() {
  const meQuery = useAdminSession()

  if (meQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    )
  }

  const admin = meQuery.data?.data.admin ?? null

  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">Sign in required.</p>
          <Link href="/yysWF440kD7q/admin" className="mt-3 inline-block text-sm font-semibold text-(--royal-blue) hover:underline">
            Go to admin login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Testing — canvas playground</h1>
            <p className="text-sm text-slate-500">
              Not saved anywhere yet — resets on refresh. Experimenting with the builder feel.
            </p>
          </div>
          <Link href="/yysWF440kD7q/admin" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            ← Back to admin
          </Link>
        </div>
        <CanvasBuilder />
      </div>
    </main>
  )
}
