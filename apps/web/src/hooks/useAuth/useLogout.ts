import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endGuestSession, logoutUser } from "@/lib/api";
import { getAccessToken } from "@/lib/token";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const user = queryClient.getQueryData<{ isGuest?: boolean }>(["user"]);
      if (user?.isGuest === true) {
        const token = getAccessToken();
        if (token) {
          await endGuestSession(token);
          return;
        }
      }
      await logoutUser();
    },
    onSettled: () => {
      queryClient.removeQueries();
      queryClient.setQueryData(["user"], null);
    },
  });
}