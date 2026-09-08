import { describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { createRegisterSchema } from "./schema";

const t = i18n.t;
const schema = createRegisterSchema(t);

const validInput = {
  name: "Anna",
  surname: "Kowalska",
  email: "anna@test.com",
  password: "Password123",
  confirmPassword: "Password123",
};

describe("register schema", () => {
  it("accepts a valid registration", () => {
    expect(schema.safeParse(validInput).success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = schema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.nameRequired")
      );
    }
  });

  it("rejects an empty surname", () => {
    const result = schema.safeParse({ ...validInput, surname: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.surnameRequired")
      );
    }
  });

  it("rejects an invalid email", () => {
    const result = schema.safeParse({ ...validInput, email: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.emailInvalid")
      );
    }
  });

  it("rejects a short password", () => {
    const result = schema.safeParse({ ...validInput, password: "Ab1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.passwordMin")
      );
    }
  });

  it("rejects a password without a capital letter", () => {
    const result = schema.safeParse({ ...validInput, password: "password123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.passwordCapital")
      );
    }
  });

  it("rejects a password without a number", () => {
    const result = schema.safeParse({ ...validInput, password: "Passwordabc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        t("validation.passwordNumber")
      );
    }
  });

  it("rejects mismatched passwords", () => {
    const result = schema.safeParse({
      ...validInput,
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