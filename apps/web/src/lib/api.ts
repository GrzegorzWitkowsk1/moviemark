import type {
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
} from "shared";
import { config } from "./config";

export async function registerUser(
  payload: RegisterRequest
): Promise<RegisterResponse> {
  let res: Response;

  try {
    res = await fetch(`${config.apiBase}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Please try again later.");
  }

  const body = (await res.json()) as
    | RegisterResponse
    | RegisterErrorResponse;

  if (!res.ok) {
    throw new Error(
      body && "error" in body
        ? body.error
        : "Something went wrong. Please try again."
    );
  }

  return body as RegisterResponse;
}
