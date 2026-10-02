import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startGuestSession } from "@/lib/api";
import { setAccessToken } from "@/lib/token";

export function useGuestSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startGuestSession,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}