import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "@/lib/api";
import { setAccessToken } from "@/lib/token";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUser({ email, password }),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}
