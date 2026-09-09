import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useLocation } from "react-router-dom";
import LoginPage from "./loginPage";
import RegisterPage from "./registerPage";
import { withAuth } from "@/hocs/withAuth";
import { withPublic } from "@/hocs/withPublic";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";

const API = "http://localhost:3000";

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

describe("LoginPage flow", () => {
  it("signs in and navigates to the home page", async () => {
    let lastLoginBody: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        lastLoginBody = await request.json();
        return HttpResponse.json({ user, accessToken: "token" });
      }),
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );
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

    await waitFor(
      () => {
        expect(screen.getByTestId("probe").textContent).toBe("/auth/home");
      },
      { timeout: 10_000 }
    );
    expect(screen.getByText("Welcome back!")).toBeTruthy();
    expect(lastLoginBody).toEqual({
      email: "anna@test.com",
      password: "Password123",
      remember: false,
    });
  });

  it("shows the server error in a snackbar on failure", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { error: "error.auth.login.invalidCredentials" },
          { status: 401 }
        )
      )
    );
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
    let lastRegisterBody: unknown;
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        lastRegisterBody = await request.json();
        return HttpResponse.json(
          { message: "Registration successful" },
          { status: 201 }
        );
      })
    );
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

    await waitFor(() => {
      expect(
        screen.getByText(
          "Registration successful, you will be redirected to the login page"
        )
      ).toBeTruthy();
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("probe").textContent).toBe("/login");
      },
      { timeout: 10_000 }
    );
    expect(lastRegisterBody).toEqual({
      name: "Anna",
      surname: "Kowalska",
      email: "anna@test.com",
      password: "Password123",
    });
  }, 15_000);
});

describe("route guards", () => {
  it("withAuth renders children for authenticated users", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );
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
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ error: "error.unauthorized" }, { status: 401 })
      )
    );
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
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ error: "error.unauthorized" }, { status: 401 })
      )
    );
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
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );
    const GuestComponent = withPublic(() => <span>Login form</span>);

    renderWithProviders(
      <>
        <GuestComponent />
        <LocationProbe />
      </>,
      { route: "/login" }
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("probe").textContent).toBe("/auth/home");
      },
      { timeout: 10_000 }
    );
  });
});
