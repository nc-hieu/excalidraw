import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  getApiBaseUrl,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  login,
  register,
  getMe,
} from "../data/backendAPI";

describe("backendAPI client", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should determine API base URL correctly", () => {
    const url = getApiBaseUrl();
    expect(url).toBeDefined();
    expect(url).toContain("4000");
  });

  it("should manage auth tokens in localStorage", () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken("sample_token_xyz");
    expect(getAuthToken()).toBe("sample_token_xyz");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it("should successfully login and persist token", async () => {
    const mockResponse = {
      token: "jwt_token_123",
      user: { id: "u1", email: "user@test.com", name: "User 1" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const res = await login("user@test.com", "password123");
    expect(res.token).toBe("jwt_token_123");
    expect(res.user.email).toBe("user@test.com");
    expect(getAuthToken()).toBe("jwt_token_123");
  });

  it("should successfully register and persist token", async () => {
    const mockResponse = {
      token: "jwt_token_456",
      user: { id: "u2", email: "new@test.com", name: "New User" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const res = await register("new@test.com", "password123", "New User");
    expect(res.token).toBe("jwt_token_456");
    expect(getAuthToken()).toBe("jwt_token_456");
  });

  it("should fetch current user with Bearer token", async () => {
    setAuthToken("jwt_token_789");
    const mockResponse = {
      user: { id: "u1", email: "user@test.com", name: "User" },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const user = await getMe();
    expect(user).toBeDefined();
    expect(user?.email).toBe("user@test.com");
  });
});
