import { beforeEach, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import {
  addMovieToCollection,
  getMovieCollectionStatus,
  loginUser,
  logoutUser,
  registerUser,
} from "./api";
import {
  clearAccessToken,
  setAccessToken,
  getAccessToken,
} from "./token";
import { server } from "@/test/server";

const API = "http://localhost:3000";

beforeEach(() => {
  clearAccessToken();
});

describe("api fetch", () => {
  it("returns parsed JSON on success", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json({ watched: false })
      )
    );

    await expect(getMovieCollectionStatus(550)).resolves.toEqual({
      watched: false,
    });
  });

  it("returns null on 204", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    const result = await getMovieCollectionStatus(550);
    expect(result).toBeNull();
  });

  it("translates error.* codes to localized messages", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json(
          { error: "error.auth.login.invalidCredentials" },
          { status: 401 }
        )
      )
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("passes through non error.* codes", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json({ error: "some.raw.code" }, { status: 400 })
      )
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow("some.raw.code");
  });

  it("falls back to error.generic for unknown bodies", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json({ nope: true }, { status: 500 })
      )
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Something went wrong. Please try again."
    );
  });

  it("throws a network error when fetch fails", async () => {
    server.use(
      http.get(`${API}/collection/movie/550`, () => HttpResponse.error())
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow(
      "Network error. Please try again later."
    );
  });
});

describe("401 refresh flow", () => {
  it("retries once with a fresh token when an expired token returns 401", async () => {
    setAccessToken("expired-token");

    const authHeaders: (string | null)[] = [];
    server.use(
      http.get(`${API}/collection/movie/550`, ({ request }) => {
        authHeaders.push(request.headers.get("authorization"));
        if (authHeaders.length === 1) {
          return HttpResponse.json(
            { error: "error.unauthorized" },
            { status: 401 }
          );
        }
        return HttpResponse.json({ watched: true });
      }),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: "new-token" })
      )
    );

    await expect(getMovieCollectionStatus(550)).resolves.toEqual({
      watched: true,
    });
    expect(getAccessToken()).toBe("new-token");
    expect(authHeaders).toEqual(["Bearer expired-token", "Bearer new-token"]);
  });

  it("clears the token and surfaces the error when refresh fails", async () => {
    setAccessToken("expired-token");

    server.use(
      http.get(`${API}/collection/movie/550`, () =>
        HttpResponse.json({ error: "error.unauthorized" }, { status: 401 })
      ),
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ error: "error.unauthorized" }, { status: 401 })
      )
    );

    await expect(getMovieCollectionStatus(550)).rejects.toThrow("Unauthorized");
    expect(getAccessToken()).toBeNull();
  });
});

describe("register and login", () => {
  it("registers without an Authorization header or refresh retry", async () => {
    setAccessToken("existing-token");

    let captured: { method: string; hasAuth: boolean } | undefined;
    server.use(
      http.post(`${API}/auth/register`, ({ request }) => {
        captured = {
          method: request.method,
          hasAuth: request.headers.has("authorization"),
        };
        return HttpResponse.json(
          { message: "Registration successful" },
          { status: 201 }
        );
      })
    );

    await registerUser({
      name: "Anna",
      surname: "Kowalska",
      email: "a@test.com",
      password: "Password123",
    });

    expect(captured?.method).toBe("POST");
    expect(captured?.hasAuth).toBe(false);
  });

  it("logs in and returns the parsed payload", async () => {
    const payload = {
      user: { id: "1", name: "Anna", email: "a@test.com" },
      accessToken: "token",
    };
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json(payload))
    );

    await expect(
      loginUser({ email: "a@test.com", password: "Password123" })
    ).resolves.toEqual(payload);
  });
});

describe("logout", () => {
  it("clears the token even when the request fails", async () => {
    setAccessToken("token");
    server.use(
      http.post(`${API}/auth/logout`, () => HttpResponse.error())
    );

    await expect(logoutUser()).rejects.toThrow(
      "Network error. Please try again later."
    );
    expect(getAccessToken()).toBeNull();
  });

  it("posts to /auth/logout and clears the token", async () => {
    setAccessToken("token");

    let captured: { method: string; url: string } | undefined;
    server.use(
      http.post(`${API}/auth/logout`, ({ request }) => {
        captured = { method: request.method, url: request.url };
        return HttpResponse.json({ message: "Logged out" });
      })
    );

    await logoutUser();
    expect(getAccessToken()).toBeNull();
    expect(captured?.method).toBe("POST");
    expect(captured?.url).toContain("/auth/logout");
  });
});

describe("request shaping", () => {
  it("sends a JSON body and content-type for mutations", async () => {
    let captured: { method: string; contentType: string | null; body: string } | undefined;
    server.use(
      http.post(`${API}/collection/movie`, async ({ request }) => {
        captured = {
          method: request.method,
          contentType: request.headers.get("content-type"),
          body: await request.text(),
        };
        return HttpResponse.json({ watched: true });
      })
    );

    await addMovieToCollection({
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      rating: 8.4,
    });

    expect(captured?.method).toBe("POST");
    expect(captured?.contentType).toBe("application/json");
    expect(captured?.body).toContain('"tmdbId":550');
  });
});
