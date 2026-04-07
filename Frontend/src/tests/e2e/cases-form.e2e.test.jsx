import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(entry = "/cases") {
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

describe("cases form e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("creates and edits a case", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url, options = {}) => {
      const method = options.method || "GET";
      const asText = String(url);
      if (asText.includes("/api/cases") && method === "GET") {
        return { ok: true, json: async () => ({ items: [{ id: 1, title: "A", status: "open", priority: "low" }], total: 1 }) };
      }
      if (asText.includes("/api/cases") && method === "POST") {
        return { ok: true, json: async () => ({ id: 2, title: "New", status: "open", priority: "high" }) };
      }
      if (asText.includes("/api/cases/1") && method === "PATCH") {
        return { ok: true, json: async () => ({ id: 1, title: "A updated", status: "closed", priority: "medium" }) };
      }
      return { ok: true, json: async () => ({ items: [], total: 0 }) };
    });

    renderApp();

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading view")).not.toBeInTheDocument();
    });
    await waitFor(() => expect(screen.getByPlaceholderText("Title")).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText("Title"), "New");
    await userEvent.type(screen.getByPlaceholderText("Description"), "Case desc");
    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "high");
    await userEvent.click(screen.getByRole("button", { name: /create case/i }));

    await userEvent.click(screen.getByRole("button", { name: /edit #1/i }));
    const editTitle = screen.getByDisplayValue("A");
    await userEvent.clear(editTitle);
    await userEvent.type(editTitle, "A updated");
    await userEvent.selectOptions(screen.getByDisplayValue("open"), "closed");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(screen.getByText("A updated")).toBeInTheDocument());
  });
});
