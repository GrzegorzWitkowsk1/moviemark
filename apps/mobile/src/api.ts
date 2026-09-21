import { loginUser, logoutUser } from "core";
import type { LoginRequest, LoginResponse } from "shared";
import { persistRefreshToken, setAccessToken } from "./core";

export async function mobileLogin(
  payload: LoginRequest
): Promise<LoginResponse> {
  const data = await loginUser(payload);
  setAccessToken(data.accessToken);
  await persistRefreshToken(data.refreshToken ?? null);
  return data;
}

export async function mobileLogout(): Promise<void> {
  try {
    await logoutUser();
  } finally {
    await persistRefreshToken(null);
    setAccessToken(null);
  }
}
