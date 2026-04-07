import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../app/auth";

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("auth context", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("sets and clears session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setSession({ token: "t1", user: { username: "anna.support" } });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.username).toBe("anna.support");

    act(() => {
      result.current.clearSession();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores session from token and user profile", async () => {
    localStorage.setItem("northstar_auth", JSON.stringify({ token: "t1", user: null }));
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 1, username: "anna.support", role: "SupportAgent" } })
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false);
      expect(result.current.user?.username).toBe("anna.support");
    });
  });

  it("calls backend logout and clears session", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({ message: "Logged out" }) });
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setSession({ token: "t1", user: { username: "anna.support" } });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
