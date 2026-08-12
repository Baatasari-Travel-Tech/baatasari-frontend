"use client"

import { useState } from "react"
import Image from "next/image"
import { apiRequest } from "@/lib/api/client"
import { RecruitmentFill } from "@/components/recruitment/RecruitmentFill"
import { coerceForm, type RecruitmentForm as RecruitmentFormSchema } from "@/lib/recruitment"

export default function RecruitmentFillClient({
  slug,
  title,
  schema,
}: {
  slug: string
  title: string
  schema: RecruitmentFormSchema
}) {
  // Hidden from real applicants (input is visually hidden below); a filled
  // value means a bot blindly filled every input it could find.
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (answers: { question: string; answer: string }[]) => {
    setError(null)
    setSubmitting(true)
    try {
      await apiRequest(`/recruitment/forms/${slug}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers, website: honeypot }),
        retryOn401: false,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate flex h-56 w-full items-end overflow-hidden sm:h-72">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image src="/talent-hero.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background" />
        </div>
        <h1 className="mx-auto w-full max-w-lg px-4 pb-6 text-center font-bricolage text-2xl font-bold text-brand-900 sm:text-3xl">
          {title}
        </h1>
      </section>

      <div className="mx-auto -mt-10 w-full max-w-lg px-4 pb-16">
        <div className="rounded-3xl border border-(--gold-soft-border) bg-white p-6 shadow-[0_34px_90px_color-mix(in_srgb,var(--brand-navy)_10%,transparent)] sm:p-8">
          {submitted ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Thanks — your application has been submitted.
            </p>
          ) : (
            <div>
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
              <RecruitmentFill form={coerceForm(schema)} submitting={submitting} onSubmit={handleSubmit} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
