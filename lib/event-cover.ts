const DEFAULT_EVENT_COVER_BASE_URL =
  "https://baatasari-events-public-535709430287-ap-south-2-an.s3.ap-south-2.amazonaws.com"

const baseUrl = (
  process.env.NEXT_PUBLIC_EVENT_COVER_BASE_URL?.trim() || DEFAULT_EVENT_COVER_BASE_URL
).replace(/\/+$/, "")

const toEpochVersion = (value?: string | number | null) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value)
  }

  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value)
    if (Number.isFinite(asNumber)) {
      return Math.floor(asNumber)
    }

    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return null
}

export const getEventCoverImageUrl = (eventId: string, version?: string | number | null) => {
  const objectKey = `events/${encodeURIComponent(eventId)}/cover.webp`
  const normalizedVersion = toEpochVersion(version)
  const versionParam = normalizedVersion !== null ? `?v=${normalizedVersion}` : ""

  return `${baseUrl}/${objectKey}${versionParam}`
}
