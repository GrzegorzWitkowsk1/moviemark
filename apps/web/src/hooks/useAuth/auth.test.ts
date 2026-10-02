import { describe, expect, it } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { getAccessToken, setAccessToken } from "@/lib/token";
import { renderHookWithProviders, createTestQueryClient } from "@/test/utils";
import { server } from "@/test/server";
import { TEST_GUEST_USER } from "@/test/handlers/apiHandlers";
import { useLogin, useLogout, useRegister, useUser, useGuestSession } from "./index";

const API = "http://localhost:3000";

const user = {
  id: "1",
  name: "Anna",
  surname: "Kowalska",
  email: "anna@test.com",
};

const guestUser = TEST_GUEST_USER;

describe("useRegister", () => {
  it("calls registerUser with the payload", async () => {
    let lastBody: unknown;
    server.use(
      http.post(`${API}/auth/register`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(
          { message: "Registration successful" },
          { status: 201 }
        );
      })
    );

    const { result } = renderHookWithProviders(() => useRegister());
    await act(async () => {
      await result.current.mutateAsync({
        name: "Anna",
        surname: "Kowalska",
        email: "a@test.com",
        password: "Password123",
      });
    });

    expect(lastBody).toEqual({
      name: "Anna",
      surname: "Kowalska",
      email: "a@test.com",
      password: "Password123",
    });
    expect(result.current.isError).toBe(false);
  });
});

describe("useLogin", () => {
  it("stores the access token and caches the user", async () => {
    let lastBody: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ user, accessToken: "token-abc" });
      })
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHookWithProviders(() => useLogin(), {
      queryClient,
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: "anna@test.com",
        password: "Password123",
        remember: true,
      });
    });

    expect(getAccessToken()).toBe("token-abc");
    expect(queryClient.getQueryData(["user"])).toEqual(user);
    expect(lastBody).toEqual({
      email: "anna@test.com",
      password: "Password123",
      remember: true,
    });
  });

  it("does not cache a user when login fails", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { error: "error.auth.login.invalidCredentials" },
          { status: 401 }
        )
      )
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHookWithProviders(() => useLogin(), {
      queryClient,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: "anna@test.com",
          password: "wrong",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    expect(queryClient.getQueryData(["user"])).toBeUndefined();
  });
});

describe("useUser", () => {
  it("reports isLoading then authenticates", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(user))
    );

    const { result } = renderHookWithProviders(() => useUser());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(result.current.user).toEqual(user);
    expect(result.current.isGuest).toBe(false);
  });

  it("flags guest sessions", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json(guestUser))
    );

    const { result } = renderHookWithProviders(() => useUser());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(result.current.isGuest).toBe(true);
  });

  it("reports not authenticated when the request fails", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ error: "error.unauthorized" }, { status: 401 })
      )
    );

    const { result } = renderHookWithProviders(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isGuest).toBe(false);
  });
});

describe("useGuestSession", () => {
  it("stores the token and caches the guest user", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHookWithProviders(() => useGuestSession(), {
      queryClient,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(getAccessToken()).toBe("guest-token");
    expect(queryClient.getQueryData(["user"])).toEqual(guestUser);
  });
});

describe("useLogout", () => {
  it("clears the user and every cached query on settle", async () => {
    server.use(
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json({ message: "Logged out" })
      )
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["user"], user);
    queryClient.setQueryData(["collection"], { movies: [], series: [] });
    queryClient.setQueryData(["statistics"], { totalMovies: 1 });
    queryClient.setQueryData(["future"], { movies: [], series: [] });

    const { result } = renderHookWithProviders(() => useLogout(), {
      queryClient,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(["user"])).toBeNull();
    expect(queryClient.getQueryState(["collection"])).toBeUndefined();
    expect(queryClient.getQueryState(["statistics"])).toBeUndefined();
    expect(queryClient.getQueryState(["future"])).toBeUndefined();
  });

  it("ends the guest session instead of a regular logout", async () => {
    let guestEndBody: unknown;
    let regularLogoutCalled = false;
    server.use(
      http.post(`${API}/auth/guest/end`, async ({ request }) => {
        guestEndBody = await request.json();
        return HttpResponse.json({ message: "Guest session ended" });
      }),
      http.post(`${API}/auth/logout`, () => {
        regularLogoutCalled = true;
        return HttpResponse.json({ message: "Logged out" });
      })
    );
    setAccessToken("guest-token");

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["user"], guestUser);
    queryClient.setQueryData(["collection"], { movies: [], series: [] });

    const { result } = renderHookWithProviders(() => useLogout(), {
      queryClient,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(regularLogoutCalled).toBe(false);
    expect(guestEndBody).toEqual({ accessToken: "guest-token" });
    expect(queryClient.getQueryData(["user"])).toBeNull();
    expect(queryClient.getQueryState(["collection"])).toBeUndefined();
    expect(getAccessToken()).toBeNull();
  });
});
