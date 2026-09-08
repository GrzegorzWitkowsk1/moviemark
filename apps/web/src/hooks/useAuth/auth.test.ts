import { describe, expect, it, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { getAccessToken } from "@/lib/token";
import { renderHookWithProviders, createTestQueryClient } from "@/test/utils";

const api = vi.hoisted(() => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import { useLogin, useLogout, useRegister, useUser } from "./index";
import { act } from "@testing-library/react";

const user = {
  id: "1",
  name: "Anna",
  surname: "Kowalska",
  email: "anna@test.com",
};

beforeEach(() => {
  api.loginUser.mockReset();
  api.registerUser.mockReset();
  api.getCurrentUser.mockReset();
  api.logoutUser.mockReset();
});

describe("useRegister", () => {
  it("calls registerUser with the payload", async () => {
    api.registerUser.mockResolvedValue({ message: "Registration successful" });

    const { result } = renderHookWithProviders(() => useRegister());
    await act(async () => {
      await result.current.mutateAsync({
        name: "Anna",
        surname: "Kowalska",
        email: "a@test.com",
        password: "Password123",
      });
    });

    expect(api.registerUser).toHaveBeenCalledWith({
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
    api.loginUser.mockResolvedValue({
      user,
      accessToken: "token-abc",
    });

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
    expect(api.loginUser).toHaveBeenCalledWith({
      email: "anna@test.com",
      password: "Password123",
      remember: true,
    });
  });

  it("does not cache a user when login fails", async () => {
    api.loginUser.mockRejectedValue(new Error("Invalid email or password"));

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
    api.getCurrentUser.mockResolvedValue(user);

    const { result } = renderHookWithProviders(() => useUser());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(result.current.user).toEqual(user);
  });

  it("reports not authenticated when the request fails", async () => {
    api.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHookWithProviders(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe("useLogout", () => {
  it("clears the user and collection caches on settle", async () => {
    api.logoutUser.mockResolvedValue(undefined);

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["user"], user);
    queryClient.setQueryData(["collection"], { movies: [], series: [] });

    const { result } = renderHookWithProviders(() => useLogout(), {
      queryClient,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(["user"])).toBeNull();
    expect(queryClient.getQueryState(["collection"])).toBeUndefined();
  });
});