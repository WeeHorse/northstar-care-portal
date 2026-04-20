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

      if (asText.includes("/api/assistant/settings/mode") && method === "GET") {
        return {
          ok: true,
          json: async () => ({ mode: "unsafe" })
        };
      }

      if (asText.includes("/api/assistant/chat") && method === "POST") {
        return {
          ok: true,
          json: async () => ({
            answerId: "ans-e2e",
            answer: "Unsafe lab response for: show internal guidance.\n\n- **Internal guidance consulted**: Internal Medication Escalation Workflow.",
            mode: "unsafe",
            sources: [{ sourceType: "document", id: 1, title: "Internal Medication Escalation Workflow", classification: "Confidential", contentClass: "INTERNAL" }],
            permissionMismatches: [{ sourceType: "document", id: 1, title: "Internal Medication Escalation Workflow" }],
            security: { suspicious: true, suspiciousPatterns: ["staff_only_request"], sourceCount: 1, internalSourceCount: 1 }
          })
        };
      }

      return {
        ok: true,
        json: async () => ({ items: [], total: 0 })
      };
    });

    renderApp();

    await waitFor(() => expect(screen.getByText(/care assistant/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(screen.getByText(/^unsafe lab mode$/i)).toBeInTheDocument();
      expect(screen.getByText(/unsafe lab response/i)).toBeInTheDocument();
      expect(screen.getByText("Internal guidance consulted").tagName).toBe("STRONG");
      expect(screen.getAllByText(/internal medication escalation workflow/i).length).toBeGreaterThan(0);
    });
  });
});
