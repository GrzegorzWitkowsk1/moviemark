import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useGuestTeardown } from "./useGuestTeardown";
import { useUser } from "@/hooks/useAuth";
import { setAccessToken } from "@/lib/token";

vi.mock("@/lib/guestTeardown", () => ({
  sendGuestTeardownBeacon: vi.fn(() => true),
}));

vi.mock("@/hooks/useAuth", () => ({
  useUser: vi.fn(),
}));

const { sendGuestTeardownBeacon } = await import("@/lib/guestTeardown");
const mockedUseUser = vi.mocked(useUser);

const guestUser = {
  user: null,
  isAuthenticated: true,
  isGuest: true,
  isLoading: false,
} as ReturnType<typeof useUser>;

const regularUser = {
  user: null,
  isAuthenticated: true,
  isGuest: false,
  isLoading: false,
} as ReturnType<typeof useUser>;

function Harness() {
  useGuestTeardown();
  return <span>mounted</span>;
}

function hideDocument() {
  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useGuestTeardown", () => {
  afterEach(() => {
    setAccessToken(null);
    vi.clearAllMocks();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  it("sends the teardown beacon when the page is hidden on unload", () => {
    mockedUseUser.mockReturnValue(guestUser);

    render(<Harness />);
    expect(screen.getByText("mounted")).toBeTruthy();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });

    expect(sendGuestTeardownBeacon).toHaveBeenCalledTimes(1);
  });

  it("keeps the session when the tab is only switched or minimised", () => {
    mockedUseUser.mockReturnValue(guestUser);

    render(<Harness />);

    act(() => {
      hideDocument();
    });

    expect(sendGuestTeardownBeacon).not.toHaveBeenCalled();
  });

  it("skips pages restored from the back/forward cache", () => {
    mockedUseUser.mockReturnValue(guestUser);

    render(<Harness />);

    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent("pagehide", { persisted: true })
      );
    });

    expect(sendGuestTeardownBeacon).not.toHaveBeenCalled();
  });

  it("sends the beacon only once", () => {
    mockedUseUser.mockReturnValue(guestUser);

    render(<Harness />);

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });

    expect(sendGuestTeardownBeacon).toHaveBeenCalledTimes(1);
  });

  it("does nothing for regular users", () => {
    mockedUseUser.mockReturnValue(regularUser);

    render(<Harness />);

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });

    expect(sendGuestTeardownBeacon).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    mockedUseUser.mockReturnValue(guestUser);

    const { unmount } = render(<Harness />);
    unmount();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent("pagehide"));
    });

    expect(sendGuestTeardownBeacon).not.toHaveBeenCalled();
  });
});