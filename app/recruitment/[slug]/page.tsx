import type { Metadata } from "next"
import { StateBlock } from "@/components/platform/state-block"
import type { RecruitmentForm as RecruitmentFormSchema } from "@/lib/recruitment"
import RecruitmentFillClient from "./recruitment-fill-client"

type PublicForm = { slug: string; title: string; schema: RecruitmentFormSchema }

async function fetchForm(slug: string): Promise<PublicForm | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/recruitment/forms/${slug}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { form?: PublicForm } }
    return json.data?.form ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const form = await fetchForm(slug)
  return { title: form?.title ?? "Application form" }
}

export default async function RecruitmentFormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const form = await fetchForm(slug)

  if (!form) {
    return (
      <main className="page-x py-10">
        <StateBlock
          tone="error"
          title="Form unavailable"
          description="This application form doesn't exist or isn't currently open."
        />
      </main>
    )
  }

  return <RecruitmentFillClient slug={form.slug} title={form.title} schema={form.schema} />
}
