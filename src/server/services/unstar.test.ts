import { describe, expect, test } from "bun:test";
import { generateUnstarToken, verifyUnstarToken } from "./unstar";

describe("Unstar Tokens", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const fullName = "vercel/next.js";

  test("generates a token containing encoded userId:fullName and HMAC", () => {
    const token = generateUnstarToken(userId, fullName);
    expect(token).toContain(".");
    const [encoded] = token.split(".");
    const decoded = Buffer.from(encoded, "base64url").toString();
    expect(decoded).toBe(`${userId}:${fullName}`);
  });

  test("verifies a valid token and returns userId and fullName", () => {
    const token = generateUnstarToken(userId, fullName);
    const result = verifyUnstarToken(token);
    expect(result).toEqual({ userId, fullName });
  });

  test("returns null for tampered signature", () => {
    const token = generateUnstarToken(userId, fullName);
    const [encoded] = token.split(".");
    const result = verifyUnstarToken(`${encoded}.tampered`);
    expect(result).toBeNull();
  });

  test("returns null for tampered payload", () => {
    const token = generateUnstarToken(userId, fullName);
    const [, sig] = token.split(".");
    const fakeEncoded = Buffer.from("fake-id:fake/repo").toString("base64url");
    const result = verifyUnstarToken(`${fakeEncoded}.${sig}`);
    expect(result).toBeNull();
  });

  test("returns null for malformed tokens", () => {
    expect(verifyUnstarToken("")).toBeNull();
    expect(verifyUnstarToken("no-dot")).toBeNull();
    expect(verifyUnstarToken("a.b.c")).toBeNull();
  });

  test("returns null for payload without colon separator", () => {
    const token = generateUnstarToken(userId, fullName);
    const [, sig] = token.split(".");
    const badEncoded = Buffer.from("no-colon-here").toString("base64url");
    expect(verifyUnstarToken(`${badEncoded}.${sig}`)).toBeNull();
  });
});
