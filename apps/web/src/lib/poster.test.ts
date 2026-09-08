import { describe, expect, it } from "vitest";
import {
  getBackdropUrl,
  getImageUrl,
  getPosterUrl,
  getStillUrl,
} from "./poster";

describe("poster helpers", () => {
  it("returns null for a null path", () => {
    expect(getImageUrl(null, "w500")).toBeNull();
    expect(getPosterUrl(null)).toBeNull();
    expect(getBackdropUrl(null)).toBeNull();
    expect(getStillUrl(null)).toBeNull();
  });

  it("builds a sized image URL", () => {
    expect(getImageUrl("/abc.jpg", "w500")).toBe(
      "https://image.tmdb.org/t/p/w500/abc.jpg"
    );
  });

  it("builds poster, backdrop and still URLs", () => {
    expect(getPosterUrl("/p.jpg")).toBe(
      "https://image.tmdb.org/t/p/w500/p.jpg"
    );
    expect(getBackdropUrl("/b.jpg")).toBe(
      "https://image.tmdb.org/t/p/w1280/b.jpg"
    );
    expect(getStillUrl("/s.jpg")).toBe(
      "https://image.tmdb.org/t/p/w300/s.jpg"
    );
  });
});