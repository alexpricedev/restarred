import { describe, expect, test } from "bun:test";

describe("encryption", () => {
  test("encrypt returns a colon-delimited string with 3 parts", async () => {
    const { encrypt } = await import("./encryption");
    const result = encrypt("my-secret-token");
    const parts = result.split(":");
    expect(parts.length).toBe(3);
  });

  test("decrypt reverses encrypt", async () => {
    const { encrypt, decrypt } = await import("./encryption");
    const original = "ghp_abc123XYZ";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test("encrypt produces different ciphertexts for same input (random IV)", async () => {
    const { encrypt } = await import("./encryption");
    const a = encrypt("same-input");
    const b = encrypt("same-input");
    expect(a).not.toBe(b);
  });

  test("decrypt throws on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("./encryption");
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    parts[1] = `0000${parts[1].slice(4)}`;
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});
