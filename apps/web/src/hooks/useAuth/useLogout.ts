import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/lib/api";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.setQueryData(["user"], null);
    },
  });
}
