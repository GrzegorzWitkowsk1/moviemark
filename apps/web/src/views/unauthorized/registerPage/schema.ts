import { z } from "zod";
import type { TFunction } from "i18next";

export function createRegisterSchema(t: TFunction) {
  return z
    .object({
      name: z.string().min(1, t("validation.nameRequired")),
      surname: z.string().min(1, t("validation.surnameRequired")),
      email: z.email(t("validation.emailInvalid")),
      password: z
        .string()
        .min(8, t("validation.passwordMin"))
        .regex(/[A-Z]/, t("validation.passwordCapital"))
        .regex(/\d/, t("validation.passwordNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsDontMatch"),
      path: ["confirmPassword"],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;