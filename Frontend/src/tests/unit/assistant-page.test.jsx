import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderAssistant() {
  localStorage.setItem(
    "northstar_auth",
    JSON.stringify({ token: "token-anna", user: { id: 1, username: "anna.support", fullName: "Anna Support", role: "SupportAgent" } })
  );

  return render(
    <MemoryRouter initialEntries={["/assistant"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("assistant page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("asks assistant and renders response sources", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const asText = String(url);
      if (asText.includes("/api/assistant/ask")) {
        return {
          ok: true,
          json: async () => ({
            answerId: "ans-1",
            answer: "Suggested guidance...",
            sources: [{ sourceType: "document", id: 2, title: "Support Guide", classification: "Internal" }],
            permissionMismatches: []
          })
        };
      }
      if (asText.includes("/api/assistant/sources/ans-1")) {
        return {
          ok: true,
          json: async () => ({
            sources: [{ sourceType: "document", id: 2, title: "Support Guide", classification: "Internal" }],
            permissionMismatches: []
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    renderAssistant();
    await waitFor(() => expect(screen.getByText(/ai assistant/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => {
      expect(screen.getByText(/suggested guidance/i)).toBeInTheDocument();
      expect(screen.getByText(/support guide/i)).toBeInTheDocument();
    });
  });
});
