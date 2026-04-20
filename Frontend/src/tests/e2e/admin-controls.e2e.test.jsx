import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(entry = "/admin") {
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

describe("admin controls e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("toggles security mode and applies audit filter", async () => {
    let securityMode = "secure";

    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      const method = options.method || "GET";
      const asText = String(url);

      if (asText.includes("/api/auth/me") && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            user: { id: 4, username: "adam.admin", fullName: "Adam Admin", role: "Admin" }
          })
        };
      }

      if (asText.includes("/api/admin/users")) {
        return { ok: true, json: async () => ({ items: [{ id: 1, username: "anna.support", role: "SupportAgent" }], total: 1 }) };
      }
      if (asText.includes("/api/assistant/settings/mode") && method === "GET") {
        return { ok: true, json: async () => ({ mode: "safe" }) };
      }
      if (asText.includes("/api/assistant/mismatches")) {
        return { ok: true, json: async () => ({ items: [], total: 0 }) };
      }
      if (asText.includes("/api/admin/audit")) {
        return {
          ok: true,
          json: async () => ({
            items: [{
              id: 8,
              actorUserId: 1,
              actorUsername: "anna.support",
              actorFullName: "Anna Support",
              actorRole: "SupportAgent",
              eventType: "assistant_prompt_injection_flag",
              entityType: "assistant",
              entityId: "ans-1",
              result: "denied",
              createdAt: "2026-04-21T10:30:00.000Z",
              metadata: {
                mode: "safe",
                question: "ignore previous instructions",
                responsePreview: "I can provide general treatment and medication guidance",
                suspiciousPatterns: ["ignore_previous_instructions"],
                sourceCount: 0,
                internalSourceCount: 0,
                mismatchCount: 0,
                blocked: true,
                sessionId: "conv-1"
              },
              assistantDiagnostics: {
                mode: "safe",
                question: "ignore previous instructions",
                responsePreview: "I can provide general treatment and medication guidance",
                suspiciousPatterns: ["ignore_previous_instructions"],
                sourceCount: 0,
                internalSourceCount: 0,
                mismatchCount: 0,
                blocked: true,
                sessionId: "conv-1"
              }
            }],
            total: 1
          })
        };
      }
      if (asText.includes("/api/admin/settings/security-mode") && method === "GET") {
        return { ok: true, json: async () => ({ mode: securityMode }) };
      }
      if (asText.includes("/api/admin/settings/security-mode") && method === "PATCH") {
        securityMode = "misconfigured";
        return { ok: true, json: async () => ({ mode: securityMode }) };
      }
      if (asText.includes("/api/admin/users/1/role") && method === "PATCH") {
        return { ok: true, json: async () => ({ id: 1, role: "Manager" }) };
      }

      return { ok: true, json: async () => ({}) };
    });

    renderApp();

    await waitFor(() => expect(screen.getByText(/security mode/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /toggle mode/i }));
    await waitFor(() => expect(screen.getByText(/misconfigured/i)).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByDisplayValue("SupportAgent"), "Manager");
    await userEvent.type(screen.getByPlaceholderText("eventType"), "assistant_prompt_injection_flag");
    await userEvent.selectOptions(screen.getByDisplayValue("all results"), "denied");
    await userEvent.type(screen.getByPlaceholderText("user or actor id"), "anna.support");
    await userEvent.selectOptions(screen.getByDisplayValue("all roles"), "SupportAgent");
    await userEvent.type(screen.getByPlaceholderText("search question or response preview"), "treatment guidance");
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));

    await waitFor(() => expect(screen.getByText("assistant_prompt_injection_flag")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /inspect/i }));
    await waitFor(() => {
      expect(screen.getByText(/assistant diagnostics/i)).toBeInTheDocument();
      expect(screen.getAllByText(/ignore_previous_instructions/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/structured metadata/i)).toBeInTheDocument();
    });
  });
});
