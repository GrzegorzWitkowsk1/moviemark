import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "@/lib/api";
import { setAccessToken } from "@/lib/token";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
      remember,
    }: {
      email: string;
      password: string;
      remember?: boolean;
    }) => loginUser({ email, password, remember }),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}
