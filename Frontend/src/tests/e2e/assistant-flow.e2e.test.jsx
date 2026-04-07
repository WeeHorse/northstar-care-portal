import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(entry = "/assistant") {
  localStorage.setItem(
    "northstar_auth",
    JSON.stringify({ token: "token-admin", user: { id: 4, username: "adam.admin", fullName: "Adam Admin", role: "Admin" } })
  );

  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("assistant flow e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("asks a question and shows sources and mismatch flags", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      const asText = String(url);
      const method = options.method || "GET";

      if (asText.includes("/api/assistant/ask") && method === "POST") {
        return {
          ok: true,
          json: async () => ({
            answerId: "ans-e2e",
            answer: "Suggested guidance based on internal sources",
            sources: [{ sourceType: "document", id: 1, title: "Clinical Data Handling", classification: "Confidential" }],
            permissionMismatches: [{ sourceType: "document", id: 1, title: "Clinical Data Handling" }]
          })
        };
      }

      if (asText.includes("/api/assistant/sources/ans-e2e")) {
        return {
          ok: true,
          json: async () => ({
            sources: [{ sourceType: "document", id: 1, title: "Clinical Data Handling", classification: "Confidential" }],
            permissionMismatches: [{ sourceType: "document", id: 1, title: "Clinical Data Handling" }]
          })
        };
      }

      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    renderApp();

    await waitFor(() => expect(screen.getByText(/ai assistant/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByText(/suggested guidance based on internal sources/i)).toBeInTheDocument();
      expect(screen.getAllByText(/clinical data handling/i).length).toBeGreaterThan(0);
    });
  });
});
