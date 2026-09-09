import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n, { STORAGE_KEY } from "@/i18n";
import { server } from "./server";

beforeAll(() => {
  vi.stubEnv("VITE_TMDB_TOKEN", "eyJtest.token.for.msw");
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  localStorage.clear();
  i18n.changeLanguage("en");
});

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

if (!window.IntersectionObserver) {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver =
    IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

if (!window.PointerEvent) {
  class PointerEventMock extends Event {
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
    }
  }
  window.PointerEvent = PointerEventMock as unknown as typeof PointerEvent;
}

Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});

Object.defineProperty(window, "scrollTo", {
  value: () => {},
  writable: true,
});

export { STORAGE_KEY };