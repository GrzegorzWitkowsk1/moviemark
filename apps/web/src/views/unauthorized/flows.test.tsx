import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import LoginPage from "./loginPage";
import RegisterPage from "./registerPage";
import { withAuth } from "@/hocs/withAuth";
import { withPublic } from "@/hocs/withPublic";
import { renderWithProviders } from "@/test/utils";

const api = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="probe">
      {location.pathname}
      {location.search}
    </div>
  );
}

const user = { id: "1", name: "Anna", surname: "Kowalska", email: "a@test.com" };

beforeEach(() => {
  api.loginUser.mockReset();
  api.registerUser.mockReset();
  api.getCurrentUser.mockReset();
  api.logoutUser.mockReset();
});

describe("LoginPage flow", () => {
  it("signs in and navigates to the home page", async () => {
    api.loginUser.mockResolvedValue({ user, accessToken: "token" });
    const userEventCtx = userEvent.setup();

    renderWithProviders(
      <>
        <LoginPage />
        <LocationProbe />
      </>,
      { route: "/login" }
    );

    await userEventCtx.type(
      screen.getByPlaceholderText("you@example.com"),
      "anna@test.com"
    );
    await userEventCtx.type(
      document.querySelector("input[type='password']")!,
      "Password123"
    );

    await userEventCtx.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("/auth/home");
    });
    expect(screen.getByText("Welcome back!")).toBeTruthy();
    expect(api.loginUser).toHaveBeenCalledWith({
      email: "anna@test.com",
      password: "Password123",
      remember: false,
    });
  });

  it("shows the server error in a snackbar on failure", async () => {
    api.loginUser.mockRejectedValue(new Error("Invalid email or password"));
    const userEventCtx = userEvent.setup();

    renderWithProviders(<LoginPage />, { route: "/login" });

    await userEventCtx.type(
      screen.getByPlaceholderText("you@example.com"),
      "anna@test.com"
    );
    await userEventCtx.type(
      document.querySelector("input[type='password']")!,
      "Password123"
    );

    await userEventCtx.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("navigates to the register page", async () => {
    const userEventCtx = userEvent.setup();
    renderWithProviders(
      <>
        <LoginPage />
        <LocationProbe />
      </>,
      { route: "/login" }
    );

    await userEventCtx.click(
      screen.getByText("Don't have an account? Create it!")
    );
    expect(screen.getByTestId("probe").textContent).toBe("/register");
  });
});

describe("RegisterPage flow", () => {
  it("registers and redirects to the login page", async () => {
    api.registerUser.mockResolvedValue({ message: "Registration successful" });
    const userEventCtx = userEvent.setup();

    renderWithProviders(
      <>
        <RegisterPage />
        <LocationProbe />
      </>,
      { route: "/register" }
    );

    await userEventCtx.type(screen.getByPlaceholderText("John"), "Anna");
    await userEventCtx.type(screen.getByPlaceholderText("Doe"), "Kowalska");
    await userEventCtx.type(
      screen.getByPlaceholderText("you@example.com"),
      "anna@test.com"
    );
    const [password, confirm] = document.querySelectorAll(
      "input[type='password']"
    );
    await userEventCtx.type(password, "Password123");
    await userEventCtx.type(confirm, "Password123");

    await userEventCtx.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(
      () => {
        expect(screen.getByTestId("probe").textContent).toBe("/login");
      },
      { timeout: 3000 }
    );
    expect(api.registerUser).toHaveBeenCalledWith({
      name: "Anna",
      surname: "Kowalska",
      email: "anna@test.com",
      password: "Password123",
    });
  });
});

describe("route guards", () => {
  it("withAuth renders children for authenticated users", async () => {
    api.getCurrentUser.mockResolvedValue(user);
    const Component = withAuth(() => <span>Protected</span>);

    renderWithProviders(
      <>
        <Component />
        <LocationProbe />
      </>,
      { route: "/auth/home" }
    );

    await waitFor(() => expect(screen.getByText("Protected")).toBeTruthy());
  });

  it("withAuth redirects unauthenticated users to login", async () => {
    api.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));
    const Component = withAuth(() => <span>Protected</span>);

    renderWithProviders(
      <>
        <Component />
        <LocationProbe />
      </>,
      { route: "/auth/home" }
    );

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("/login");
    });
  });

  it("withPublic renders children for guests and redirects authenticated users home", async () => {
    api.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));
    const GuestComponent = withPublic(() => <span>Login form</span>);

    renderWithProviders(
      <>
        <GuestComponent />
        <LocationProbe />
      </>,
      { route: "/login" }
    );
    await waitFor(() => expect(screen.getByText("Login form")).toBeTruthy());
  });

  it("withPublic redirects authenticated users away from guest pages", async () => {
    api.getCurrentUser.mockResolvedValue(user);
    const GuestComponent = withPublic(() => <span>Login form</span>);

    renderWithProviders(
      <>
        <GuestComponent />
        <LocationProbe />
      </>,
      { route: "/login" }
    );

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe("/auth/home");
    });
  });
});