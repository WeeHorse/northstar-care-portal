import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { App } from "../../app/App";
import { AuthProvider } from "../../app/auth";

function renderApp(entry = "/documents") {
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

describe("documents upload e2e", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("uploads a document and renders it in list", async () => {
    let uploadCalled = false;
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
      if (asText.includes("/api/documents") && method === "GET") {
        return { ok: true, json: async () => ({ items: [], total: 0 }) };
      }
      if (asText.includes("/api/documents/upload") && method === "POST") {
        uploadCalled = true;
        return {
          ok: true,
          json: async () => ({ id: 99, title: "Uploaded Policy", classification: "Internal", category: "policy" })
        };
      }
      return { ok: true, json: async () => ({ items: [], total: 0 }) };
    });

    renderApp();

    await waitFor(() => expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Upload title"), "Uploaded Policy");
    const file = new File(["hello"], "policy.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Document file"), { target: { files: [file] } });
    const uploadButton = screen.getByRole("button", { name: /upload/i });
    fireEvent.submit(uploadButton.closest("form"));

    await waitFor(() => expect(uploadCalled).toBe(true));
  });
});
