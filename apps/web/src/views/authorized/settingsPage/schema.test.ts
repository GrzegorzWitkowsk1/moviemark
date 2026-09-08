import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { createPasswordSchema, createProfileSchema } from "./schema";

const t = i18n.t;

describe("profile schema", () => {
  const schema = createProfileSchema(t);

  it("accepts a valid profile", () => {
    const result = schema.safeParse({
      name: "Anna",
      surname: "Nowak",
      email: "anna@test.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = schema.safeParse({
      name: "",
      surname: "Nowak",
      email: "anna@test.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.nameRequired")
      );
    }
  });

  it("rejects an invalid email", () => {
    const result = schema.safeParse({
      name: "Anna",
      surname: "Nowak",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.emailInvalid")
      );
    }
  });
});

describe("password schema", () => {
  const schema = createPasswordSchema(t);

  it("accepts a valid new password", () => {
    const result = schema.safeParse({
      newPassword: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = schema.safeParse({
      newPassword: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.passwordMin")
      );
    }
  });

  it("rejects mismatched passwords", () => {
    const result = schema.safeParse({
      newPassword: "Password123",
      confirmPassword: "Password124",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword"
      );
      expect(issue?.message).toBe(t("validation.passwordsDontMatch"));
    }
  });
});