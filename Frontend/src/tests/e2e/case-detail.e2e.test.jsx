import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(entry = "/cases/1") {
  localStorage.setItem(
    "northstar_auth",
    JSON.stringify({ token: "token-1", user: { id: 1, username: "anna.support", fullName: "Anna Support", role: "SupportAgent" } })
  );

  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("case detail e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads case detail by route id", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const asText = String(url);
      if (asText.includes("/api/auth/me")) {
        return { ok: true, json: async () => ({ user: { id: 1, username: "anna.support", role: "SupportAgent" } }) };
      }
      if (asText.includes("/api/cases/1")) {
        return {
          ok: true,
          json: async () => ({ id: 1, title: "Case One", description: "desc", status: "open", priority: "high" })
        };
      }
      return { ok: true, json: async () => ({ items: [], total: 0 }) };
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/case #1/i)).toBeInTheDocument();
      expect(screen.getByText(/case one/i)).toBeInTheDocument();
    });
  });
});
