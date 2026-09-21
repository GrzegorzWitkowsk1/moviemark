import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mobileLogin, mobileLogout } from "@/api";

export function useMobileLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mobileLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useMobileLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mobileLogout,
    onSettled: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["collection"] });
    },
  });
}
