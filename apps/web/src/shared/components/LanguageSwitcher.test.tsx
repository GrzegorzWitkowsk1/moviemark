import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import i18n, { STORAGE_KEY } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { renderWithProviders } from "@/test/utils";

describe("LanguageSwitcher", () => {
  it("switches the active language and persists it", async () => {
    renderWithProviders(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Language" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);

    fireEvent.click(screen.getByText("Polski"));
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe("pl");
    });
    expect(i18n.language).toBe("pl");

    fireEvent.click(screen.getByRole("button", { name: "Język" }));
    fireEvent.click(screen.getByText("English"));
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
    });
    expect(i18n.language).toBe("en");
  });
});