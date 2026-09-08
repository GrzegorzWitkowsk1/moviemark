import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import MediaTypeToggle from "./MediaTypeToggle";
import { renderWithProviders } from "@/test/utils";

describe("MediaTypeToggle", () => {
  it("highlights the active option without firing onChange", () => {
    const onChange = vi.fn();
    renderWithProviders(<MediaTypeToggle value="movie" onChange={onChange} />);

    fireEvent.click(screen.getByText("Movies"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fires onChange with the clicked option", () => {
    const onChange = vi.fn();
    renderWithProviders(<MediaTypeToggle value="movie" onChange={onChange} />);

    fireEvent.click(screen.getByText("Series"));
    expect(onChange).toHaveBeenCalledWith("tv");
  });
});