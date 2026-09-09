import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import MovieCard, { type MovieCardData } from "./MovieCard";
import { renderWithProviders } from "@/test/utils";

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="probe">
      {location.pathname}
      {location.search}
    </div>
  );
}

const baseMovie: MovieCardData = {
  mediaType: "movie",
  id: 550,
  title: "Fight Club",
  year: "1999-10-15",
  overview: "An insomniac and a soap maker.",
  posterPath: "/fight-club.jpg",
  rating: 8.4,
  voteCount: 25000,
  genreIds: [28],
};

describe("MovieCard", () => {
  it("renders title, poster, rating and resolved genre", async () => {
    renderWithProviders(<MovieCard movie={baseMovie} />);

    expect(screen.getByText("Fight Club")).toBeTruthy();
    const poster = screen.getByRole("img", { name: "Fight Club" });
    expect(poster.getAttribute("src")).toContain("/fight-club.jpg");
    expect(screen.getByText("8.4")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("1999 · Action")).toBeTruthy());
  });

  it("hides the rating overlay in the light variant", async () => {
    renderWithProviders(<MovieCard movie={baseMovie} variant="light" />);

    expect(screen.queryByText("8.4")).toBeNull();
  });

  it("navigates to the movie details page when clicked", async () => {
    renderWithProviders(
      <>
        <MovieCard movie={baseMovie} />
        <LocationProbe />
      </>
    );

    fireEvent.click(screen.getByText("Fight Club"));
    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toBe(
        "/auth/movies?id=550&type=movie"
      );
    });
  });
});