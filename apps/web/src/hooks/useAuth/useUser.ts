import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/api";

export function useUser() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  return {
    user: data ?? null,
    isAuthenticated: !!data && !error,
    isLoading,
  };
}
