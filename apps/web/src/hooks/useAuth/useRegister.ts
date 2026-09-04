import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/api";
import type { RegisterRequest } from "shared";

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerUser(data),
  });
}
