import { describe, expect, test } from "bun:test";
import { generateUnstarToken, verifyUnstarToken } from "./unstar";

describe("Unstar Tokens", () => {
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const fullName = "vercel/next.js";

  test("generates a token containing encoded userId:fullName:timestamp and HMAC", () => {
    const now = Date.now();
    const token = generateUnstarToken(userId, fullName, now);
    expect(token).toContain(".");
    const [encoded] = token.split(".");
    const decoded = Buffer.from(encoded, "base64url").toString();
    expect(decoded).toBe(`${userId}:${fullName}:${now}`);
  });

  test("verifies a valid token and returns userId and fullName", () => {
    const now = Date.now();
    const token = generateUnstarToken(userId, fullName, now);
    const result = verifyUnstarToken(token, now);
    expect(result).toEqual({ userId, fullName });
  });

  test("returns null for tampered signature", () => {
    const token = generateUnstarToken(userId, fullName);
    const [encoded] = token.split(".");
    const result = verifyUnstarToken(`${encoded}.tampered`);
    expect(result).toBeNull();
  });

  test("returns null for tampered payload", () => {
    const now = Date.now();
    const token = generateUnstarToken(userId, fullName, now);
    const [, sig] = token.split(".");
    const fakeEncoded = Buffer.from(`fake-id:fake/repo:${now}`).toString(
      "base64url",
    );
    const result = verifyUnstarToken(`${fakeEncoded}.${sig}`, now);
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

  test("returns null for expired token (older than 30 days)", () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const token = generateUnstarToken(userId, fullName, thirtyOneDaysAgo);
    expect(verifyUnstarToken(token)).toBeNull();
  });

  test("accepts a token just under 30 days old", () => {
    const twentyNineDaysAgo = Date.now() - 29 * 24 * 60 * 60 * 1000;
    const token = generateUnstarToken(userId, fullName, twentyNineDaysAgo);
    expect(verifyUnstarToken(token)).toEqual({ userId, fullName });
  });
});
