import { describe, expect, test } from "bun:test";
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from "./unsubscribe";

describe("Unsubscribe Tokens", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";

  test("generates a token containing encoded user ID and HMAC", () => {
    const token = generateUnsubscribeToken(userId);
    expect(token).toContain(".");
    const [encoded] = token.split(".");
    const decoded = Buffer.from(encoded, "base64url").toString();
    expect(decoded).toBe(userId);
  });

  test("verifies a valid token and returns user ID", () => {
    const token = generateUnsubscribeToken(userId);
    const result = verifyUnsubscribeToken(token);
    expect(result).toBe(userId);
  });

  test("returns null for tampered signature", () => {
    const token = generateUnsubscribeToken(userId);
    const [encoded] = token.split(".");
    const result = verifyUnsubscribeToken(`${encoded}.tampered`);
    expect(result).toBeNull();
  });

  test("returns null for tampered user ID", () => {
    const token = generateUnsubscribeToken(userId);
    const [, sig] = token.split(".");
    const fakeEncoded = Buffer.from("fake-user-id").toString("base64url");
    const result = verifyUnsubscribeToken(`${fakeEncoded}.${sig}`);
    expect(result).toBeNull();
  });

  test("returns null for malformed tokens", () => {
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("no-dot")).toBeNull();
    expect(verifyUnsubscribeToken("a.b.c")).toBeNull();
  });
});
