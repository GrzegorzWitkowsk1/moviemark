import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegisterRequest } from "shared";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/endpoints";
import { coreConfig } from "../config";

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
      coreConfig().setAccessToken(data.accessToken);
      queryClient.setQueryData(["user"], data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerUser(data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["collection"] });
    },
  });
}
