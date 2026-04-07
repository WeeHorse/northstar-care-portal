import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(initialEntry = "/login") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("login to dashboard e2e", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("logs in and lands on dashboard", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const asText = String(url);
      if (asText.includes("/api/auth/login")) {
        return {
          ok: true,
          json: async () => ({
            token: "token-1",
            user: { id: 1, username: "anna.support", fullName: "Anna Support", role: "SupportAgent" }
          })
        };
      }

      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    renderApp("/login");

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading view")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });
});
