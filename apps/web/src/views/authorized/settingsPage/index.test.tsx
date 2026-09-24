import { describe, expect, it } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import SettingsPage from "./index";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

const user = { id: "1", name: "Anna", surname: "Kowalska", email: "anna@test.com" };

describe("SettingsPage profile form", () => {
  it("submits the profile update and shows a success message", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );
    let lastProfileBody: unknown;
    server.use(
      http.put(`${API}/auth/profile`, async ({ request }) => {
        lastProfileBody = await request.json();
        return HttpResponse.json({
          user: { ...user, surname: "Nowak" },
          accessToken: "new-token",
        });
      })
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<SettingsPage />, { route: "/auth/settings" });

    const name = await screen.findByPlaceholderText("Your name");
    const surname = screen.getByPlaceholderText("Your surname");
    const email = screen.getByPlaceholderText("you@example.com");
    await userEventCtx.clear(name);
    await userEventCtx.type(name, "Anna");
    await userEventCtx.clear(surname);
    await userEventCtx.type(surname, "Nowak");
    await userEventCtx.clear(email);
    await userEventCtx.type(email, "anna@test.com");

    await userEventCtx.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Profile updated!")).toBeTruthy();
    });
    expect(lastProfileBody).toEqual({
      name: "Anna",
      surname: "Nowak",
      email: "anna@test.com",
    });
  });
});

describe("SettingsPage password form", () => {
  it("changes the password and shows a success message", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );
    let lastPasswordBody: unknown;
    server.use(
      http.put(`${API}/auth/password`, async ({ request }) => {
        lastPasswordBody = await request.json();
        return HttpResponse.json({ message: "changed" });
      })
    );
    const userEventCtx = userEvent.setup();

    renderWithProviders(<SettingsPage />, { route: "/auth/settings" });

    const newPassword = await screen.findByPlaceholderText("Enter new password");
    const confirmPassword = screen.getByPlaceholderText("Confirm new password");
    await userEventCtx.type(newPassword, "Password123");
    await userEventCtx.type(confirmPassword, "Password123");

    await userEventCtx.click(
      screen.getByRole("button", { name: "Change Password" })
    );

    await waitFor(() => {
      expect(screen.getByText("Password changed!")).toBeTruthy();
    });
    expect(lastPasswordBody).toEqual({
      newPassword: "Password123",
    });
  });
});

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("file input not found");
  }
  return input;
}

describe("SettingsPage avatar", () => {
  it("uploads a valid avatar and shows a success message", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ ...user, avatar: null })
      )
    );
    let called = false;
    server.use(
      http.put(`${API}/auth/avatar`, () => {
        called = true;
        return HttpResponse.json({
          user: { ...user, avatar: "data:image/png;base64,fake" },
          accessToken: "avatar-token",
        });
      })
    );
    const userEventCtx = userEvent.setup();
    const { container } = renderWithProviders(<SettingsPage />, {
      route: "/auth/settings",
    });

    await screen.findByPlaceholderText("Your name");
    const file = new File(["fake-png"], "me.png", { type: "image/png" });
    await userEventCtx.upload(fileInput(container), file);

    await waitFor(() => {
      expect(screen.getByText("Avatar updated!")).toBeTruthy();
    });
    expect(called).toBe(true);
  });

  it("rejects a non jpeg/png file without calling the API", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ ...user, avatar: null })
      )
    );
    let called = false;
    server.use(
      http.put(`${API}/auth/avatar`, () => {
        called = true;
        return HttpResponse.json({ user, accessToken: "t" });
      })
    );
    const { container } = renderWithProviders(<SettingsPage />, {
      route: "/auth/settings",
    });

    await screen.findByPlaceholderText("Your name");
    const file = new File(["gif"], "me.gif", { type: "image/gif" });
    fireEvent.change(fileInput(container), { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Only JPEG or PNG images are allowed")
      ).toBeTruthy();
    });
    expect(called).toBe(false);
  });

  it("rejects an oversized file without calling the API", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ ...user, avatar: null })
      )
    );
    let called = false;
    server.use(
      http.put(`${API}/auth/avatar`, () => {
        called = true;
        return HttpResponse.json({ user, accessToken: "t" });
      })
    );
    const userEventCtx = userEvent.setup();
    const { container } = renderWithProviders(<SettingsPage />, {
      route: "/auth/settings",
    });

    await screen.findByPlaceholderText("Your name");
    const big = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });
    await userEventCtx.upload(fileInput(container), big);

    await waitFor(() => {
      expect(
        screen.getByText("Image is too large (max 2 MB)")
      ).toBeTruthy();
    });
    expect(called).toBe(false);
  });
});