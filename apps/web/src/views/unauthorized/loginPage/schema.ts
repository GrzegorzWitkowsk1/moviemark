import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;