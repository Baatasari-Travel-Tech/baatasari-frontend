import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api/client"
import type { ApiEnvelope } from "@/types/api"

export type AdminRole = "SUPERADMIN" | "ADMIN"

export type Admin = {
  id: string
  username: string
  role: AdminRole
  createdAt?: string
}

export const meQueryKey = ["admin-me"]

/** Shared session guard for every page under the obscure admin prefix. */
export function useAdminSession() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => apiRequest<ApiEnvelope<{ admin: Admin }>>("/admin/auth/me", { retryOn401: false }),
    retry: false,
  })
}
