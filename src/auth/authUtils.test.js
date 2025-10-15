import { describe, it, expect, vi } from "vitest";
import { getUserIdFromToken } from "../auth/authUtils";

// Mock jwt-decode if it's used in authUtils
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

describe("authUtils", () => {
  describe("getUserIdFromToken", () => {
    it("returns null when no token is provided", () => {
      const result = getUserIdFromToken();
      expect(result).toBeNull();
    });

    it("returns null when token is empty string", () => {
      const result = getUserIdFromToken("");
      expect(result).toBeNull();
    });

    it("returns null when token is null", () => {
      const result = getUserIdFromToken(null);
      expect(result).toBeNull();
    });

    it("returns null when token is undefined", () => {
      const result = getUserIdFromToken(undefined);
      expect(result).toBeNull();
    });

    it("handles invalid token format gracefully", () => {
      const invalidToken = "invalid-token-format";
      const result = getUserIdFromToken(invalidToken);
      expect(result).toBeNull();
    });

    it("handles malformed JWT token", () => {
      const malformedToken = "not.a.valid.jwt";
      const result = getUserIdFromToken(malformedToken);
      expect(result).toBeNull();
    });
  });
});
