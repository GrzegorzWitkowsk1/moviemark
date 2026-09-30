import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import LoadingScreen from "./LoadingScreen";
import { renderWithProviders } from "@/test/utils";

describe("LoadingScreen", () => {
  it("announces progress while pending", () => {
    renderWithProviders(<LoadingScreen state="pending" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Checking connection...")).toBeInTheDocument();
  });

  it("shows the elapsed seconds counter", () => {
    renderWithProviders(<LoadingScreen state="pending" />);

    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("marks the pending screen as busy", () => {
    const { container } = renderWithProviders(<LoadingScreen state="pending" />);

    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  });

  it("reports failure when the server is unreachable", () => {
    renderWithProviders(<LoadingScreen state="failed" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Couldn't reach the server. It may have gone to sleep.")
    ).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is pressed", () => {
    const onRetry = vi.fn();
    renderWithProviders(<LoadingScreen state="failed" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("stops reporting busy once failed", () => {
    const { container } = renderWithProviders(<LoadingScreen state="failed" />);

    expect(container.firstChild).toHaveAttribute("aria-busy", "false");
  });
});
