import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./index";
import { renderWithProviders } from "@/test/utils";

const api = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

const user = { id: "1", name: "Anna", surname: "Kowalska", email: "anna@test.com" };

beforeEach(() => {
  api.getCurrentUser.mockReset();
  api.updateProfile.mockReset();
  api.changePassword.mockReset();
  api.getCurrentUser.mockResolvedValue(user);
});

describe("SettingsPage profile form", () => {
  it("submits the profile update and shows a success message", async () => {
    api.updateProfile.mockResolvedValue({
      user: { ...user, surname: "Nowak" },
      accessToken: "new-token",
    });
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
    expect(api.updateProfile).toHaveBeenCalledWith({
      name: "Anna",
      surname: "Nowak",
      email: "anna@test.com",
    });
  });
});

describe("SettingsPage password form", () => {
  it("changes the password and shows a success message", async () => {
    api.changePassword.mockResolvedValue({ message: "changed" });
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
    expect(api.changePassword).toHaveBeenCalledWith({
      newPassword: "Password123",
    });
  });
});