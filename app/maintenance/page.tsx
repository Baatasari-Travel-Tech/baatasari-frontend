import Image from "next/image"
import { MAINTENANCE_ALLOWED } from "@/lib/seo"

export const metadata = {
  title: "Under Maintenance",
  description: "Baatasari is currently undergoing scheduled maintenance.",
}

type MaintenanceInfo = {
  message: string | null
  /** From site-config, so changing it there changes it here. */
  contactEmail: string
  /**
   * The "we'll be back at" time, already parsed and validated to be in the
   * future. Null when absent, unparseable, or already past.
   *
   * Resolved here rather than in the component because comparing against
   * `Date.now()` is an impure read: doing it while rendering makes the output
   * depend on when React happens to run, which is exactly what the
   * react-hooks/purity rule flags. Data fetching is the right place for it.
   */
  backAt: Date | null
}

const FALLBACK_CONTACT_EMAIL = "contact-us@baatasari.com"

/**
 * Every event, every admin and every organizer is in India, and the time an
 * admin picks in the app is their local wall-clock time. This page renders on
 * the server, where Node's zone is UTC — formatting without an explicit
 * timeZone silently produced the UTC reading, so a window set for 11:00 PM
 * advertised itself as 5:30 pm.
 */
const IST = "Asia/Kolkata"

const formatBackAt = (at: Date): string =>
  `${at.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: IST,
  })} IST`

const DEFAULT_MESSAGE =
  "Baatasari is taking a short break for some scheduled upgrades. We're working to bring everything back online as quickly as possible. Thanks for your patience."

// Best-effort only — if this fails, the default copy below still renders
// correctly on its own. This page is excluded from the middleware's
// maintenance rewrite, so fetching here never recurses into itself.
async function getMaintenanceInfo(): Promise<MaintenanceInfo> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/site-config`, { cache: "no-store" })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as {
      data?: {
        maintenanceMessage?: string | null
        maintenanceTo?: string | null
        contactEmail?: string | null
      }
    }
    const to = json?.data?.maintenanceTo ?? null
    const parsed = to ? new Date(to) : null
    return {
      message: json?.data?.maintenanceMessage ?? null,
      contactEmail: json?.data?.contactEmail?.trim() || FALLBACK_CONTACT_EMAIL,
      backAt:
        parsed && !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()
          ? parsed
          : null,
    }
  } catch {
    return { message: null, contactEmail: FALLBACK_CONTACT_EMAIL, backAt: null }
  }
}

// Static fallback page shown across the whole site while the admin has
// maintenance mode ON. The middleware rewrites every public route here, so
// this must stand entirely on its own even if the data fetch below fails.
export default async function MaintenancePage() {
  const { message, backAt, contactEmail } = await getMaintenanceInfo()

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c1D37] px-6 text-center text-white">
      {/* soft glow accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#2b4570] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#2b4570] opacity-30 blur-3xl" />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <Image
          src="/brand-96.webp"
          alt="Baatasari"
          width={72}
          height={72}
          className="mb-8 h-16 w-16 rounded-2xl bg-white/95 p-2 shadow-lg"
          priority
        />

        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          We&apos;ll be right back
        </span>

        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Under Maintenance
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          {message?.trim() ? message : DEFAULT_MESSAGE}
        </p>

        {backAt ? (
          <p className="mt-2 text-sm text-white/50">Expected back {formatBackAt(backAt)}</p>
        ) : null}

        {/* Links to the real contact page, which the maintenance gate lets
            through — a mailto: does nothing at all on a device with no mail
            client configured, which is most desktop browsers. */}
        <a
          href="/contact-us"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0c1D37] transition hover:bg-white/90"
        >
          Need help? Contact us
        </a>

        {/* Spelled out as well, so there is still a way to reach us if the
            contact form's API is part of whatever is being worked on. */}
        <p className="mt-4 text-xs text-white/40">
          or email{" "}
          <a href={`mailto:${contactEmail}`} className="underline underline-offset-2 hover:text-white/70">
            {contactEmail}
          </a>
        </p>

        {/* The pages that stay up during maintenance, listed from the same
            allowlist the gate uses — so a link here can never point at
            something the gate rewrites out from under it. */}
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {MAINTENANCE_ALLOWED.filter(({ path }) => path !== "/contact-us").map(
            ({ path, label }) => (
              <a
                key={path}
                href={path}
                className="text-xs text-white/40 underline-offset-2 transition hover:text-white/70 hover:underline"
              >
                {label}
              </a>
            ),
          )}
        </nav>

        <p className="mt-6 text-xs text-white/40">
          © Baatasari · Discover, Connect, Experience
        </p>
      </div>
    </main>
  )
}
