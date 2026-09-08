import { z } from "zod";
import type { TFunction } from "i18next";

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
    remember: z.boolean(),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;