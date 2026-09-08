import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { createLoginSchema } from "./schema";

const t = i18n.t;
const schema = createLoginSchema(t);

describe("login schema", () => {
  it("accepts a valid login", () => {
    const result = schema.safeParse({
      email: "user@test.com",
      password: "password123",
      remember: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = schema.safeParse({
      email: "not-an-email",
      password: "password123",
      remember: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.emailInvalid")
      );
    }
  });

  it("rejects an empty password", () => {
    const result = schema.safeParse({
      email: "user@test.com",
      password: "",
      remember: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.passwordRequired")
      );
    }
  });
});