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
      if (asText.includes("/api/admin/audit")) {
        return { ok: true, json: async () => ({ items: [{ id: 8, eventType: "login_attempt", result: "success", createdAt: "t" }], total: 1 }) };
      }
      if (asText.includes("/api/admin/settings/security-mode") && method === "GET") {
        return { ok: true, json: async () => ({ mode: "secure" }) };
      }
      if (asText.includes("/api/admin/settings/security-mode") && method === "PATCH") {
        return { ok: true, json: async () => ({ mode: "misconfigured" }) };
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
    await userEvent.type(screen.getByPlaceholderText("eventType"), "login_attempt");
    await userEvent.selectOptions(screen.getByDisplayValue("all results"), "success");
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));

    await waitFor(() => expect(screen.getByText("login_attempt")).toBeInTheDocument());
  });
});
