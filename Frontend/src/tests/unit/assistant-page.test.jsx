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
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      const asText = String(url);
      const method = options.method || "GET";
      if (asText.includes("/api/assistant/settings/mode") && method === "GET") {
        return {
          ok: true,
          json: async () => ({ mode: "safe" })
        };
      }
      if (asText.includes("/api/assistant/chat")) {
        return {
          ok: true,
          json: async () => ({
            answerId: "ans-1",
            answer: "If you miss a dose:\n\n- **Take it when you remember** if it is not close to the next dose.\n- Do not take a double dose.",
            mode: "safe",
            sources: [{ sourceType: "document", id: 2, title: "Patient Medication Guidance", classification: "Restricted", contentClass: "PATIENT" }],
            permissionMismatches: []
            , security: { suspicious: false, suspiciousPatterns: [], sourceCount: 1, internalSourceCount: 0 }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    renderAssistant();
    await waitFor(() => expect(screen.getByText(/care assistant/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(screen.getByText(/take it when you remember/i)).toBeInTheDocument();
      expect(screen.getByText(/do not take a double dose/i)).toBeInTheDocument();
      expect(screen.getByText("Take it when you remember").tagName).toBe("STRONG");
      expect(screen.getByText(/patient medication guidance/i)).toBeInTheDocument();
      expect(screen.getByText(/safe mode/i)).toBeInTheDocument();
    });
  });
});
