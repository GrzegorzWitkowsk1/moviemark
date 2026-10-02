import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import { GUEST_BANNER_STORAGE_KEY } from "./GuestBanner";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

const GUEST_USER = {
  id: "guest-1",
  name: "Guest",
  surname: "Account",
  email: "guest-1@guest.moviemark.local",
  avatar: null,
  isGuest: true,
};

const REGULAR_USER = {
  id: "user-1",
  name: "Anna",
  surname: "Kowalska",
  email: "anna@test.com",
  avatar: null,
  isGuest: false,
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="probe">{location.pathname}</div>;
}

function mockMe(user: object) {
  server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(user)));
}

describe("GuestBanner in AppLayout", () => {
  it("explains the guest account and links to the register page", async () => {
    mockMe(GUEST_USER);
    const userEventCtx = userEvent.setup();

    renderWithProviders(
      <>
        <AppLayout>
          <span>App content</span>
        </AppLayout>
        <LocationProbe />
      </>,
      { route: "/auth/home" }
    );

    expect(await screen.findByText("App content")).toBeTruthy();
    expect(
      await screen.findByText("You are using a guest account")
    ).toBeTruthy();

    await userEventCtx.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByTestId("probe").textContent).toBe("/register");
  });

  it("stays hidden for regular users", async () => {
    mockMe(REGULAR_USER);

    renderWithProviders(
      <AppLayout>
        <span>App content</span>
      </AppLayout>,
      { route: "/auth/home" }
    );

    await waitFor(() => {
      expect(screen.getByText("App content")).toBeTruthy();
    });
    expect(
      screen.queryByText("You are using a guest account")
    ).toBeNull();
  });

  it("can be dismissed and remembers the choice for that guest", async () => {
    mockMe(GUEST_USER);
    const userEventCtx = userEvent.setup();

    const { unmount } = renderWithProviders(
      <AppLayout>
        <span>App content</span>
      </AppLayout>,
      { route: "/auth/home" }
    );

    const dismiss = await screen.findByRole("button", {
      name: "Dismiss guest notice",
    });
    await userEventCtx.click(dismiss);

    await waitFor(() => {
      expect(
        screen.queryByText("You are using a guest account")
      ).toBeNull();
    });
    expect(
      sessionStorage.getItem(`${GUEST_BANNER_STORAGE_KEY}.${GUEST_USER.id}`)
    ).toBe("true");

    unmount();
    renderWithProviders(
      <AppLayout>
        <span>App content</span>
      </AppLayout>,
      { route: "/auth/home" }
    );

    await waitFor(() => {
      expect(screen.getByText("App content")).toBeTruthy();
    });
    expect(screen.queryByText("You are using a guest account")).toBeNull();
  });

  it("shows the notice again for a different guest", async () => {
    mockMe(GUEST_USER);
    const first = userEvent.setup();

    const { unmount } = renderWithProviders(
      <AppLayout>
        <span>App content</span>
      </AppLayout>,
      { route: "/auth/home" }
    );

    await first.click(
      await screen.findByRole("button", { name: "Dismiss guest notice" })
    );
    await waitFor(() => {
      expect(screen.queryByText("You are using a guest account")).toBeNull();
    });

    unmount();
    mockMe({ ...GUEST_USER, id: "guest-2" });
    renderWithProviders(
      <AppLayout>
        <span>App content</span>
      </AppLayout>,
      { route: "/auth/home" }
    );

    expect(await screen.findByText("You are using a guest account")).toBeTruthy();
  });
});