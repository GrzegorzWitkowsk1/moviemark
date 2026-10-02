import { config } from "./config";
import { getAccessToken } from "./token";

const GUEST_END_PATH = "/auth/guest/end";

function payload(token: string): Blob {
  return new Blob([JSON.stringify({ accessToken: token })], {
    type: "application/json",
  });
}

/**
 * Best-effort guest teardown used on tab close / page hide. Beacons cannot set
 * headers, so the access token travels in the body and is verified server-side.
 */
export function sendGuestTeardownBeacon(): boolean {
  const token = getAccessToken();
  if (!token || typeof navigator === "undefined") {
    return false;
  }

  const url = `${config.apiBase}${GUEST_END_PATH}`;

  if (typeof navigator.sendBeacon === "function") {
    try {
      if (navigator.sendBeacon(url, payload(token))) {
        return true;
      }
    } catch {
      // fall through to the fetch fallback
    }
  }

  try {
    void fetch(url, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: payload(token),
    });
    return true;
  } catch {
    return false;
  }
}