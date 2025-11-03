import { useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const queryKeys = {
  auth: ["auth", "me"] as const,
};

// Auth hook - uses cookie automatically
export function useAuth() {
  return useQuery({
    queryKey: queryKeys.auth,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
