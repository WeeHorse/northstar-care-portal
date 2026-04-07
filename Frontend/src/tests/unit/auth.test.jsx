import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../app/auth";

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("auth context", () => {
  beforeEach(() => {
    localStorage.clear();
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
});
