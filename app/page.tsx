import type { Metadata } from "next"
import HomeClient from "./home-client"

const title = "Baatasari — Discover, Connect, Experience"
const description = "Book the best events, dining, and activities near you — curated events, venues, and experiences all in one place."

export const metadata: Metadata = {
  // `absolute` opts out of the root template — the homepage title already
  // carries the brand and would otherwise read "Baatasari — … · Baatasari".
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Baatasari",
    title,
    description,
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "Baatasari" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-home.jpg"],
  },
}

export default function Page() {
  return <HomeClient />
}
