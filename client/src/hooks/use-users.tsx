import { useQuery } from "@tanstack/react-query";

// Simple hook to fetch users
export function useUsers() {
  return useQuery({
    queryKey: ["/api/users"],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}