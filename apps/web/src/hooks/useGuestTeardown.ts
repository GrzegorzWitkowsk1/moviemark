import { useEffect, useRef } from "react";
import { useUser } from "@/hooks/useAuth";
import { sendGuestTeardownBeacon } from "@/lib/guestTeardown";

/**
 * Removes the guest account when the tab is closed. Only `pagehide` is used:
 * `visibilitychange` also fires when the tab is merely switched or minimised,
 * which would delete the session of a guest who comes right back. Pages put
 * into the back/forward cache (`persisted`) can be restored, so those are
 * skipped too. The beacon is best-effort: the server sweep is the
 * authoritative backstop.
 */
export function useGuestTeardown() {
  const { isGuest } = useUser();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!isGuest) {
      sentRef.current = false;
      return;
    }

    const onPageHide = (event: PageTransitionEvent) => {
      if (sentRef.current || event.persisted) {
        return;
      }
      sentRef.current = true;
      sendGuestTeardownBeacon();
    };

    window.addEventListener("pagehide", onPageHide);

    return () => window.removeEventListener("pagehide", onPageHide);
  }, [isGuest]);
}