import { computeHMAC, verifyHMAC } from "../utils/crypto";

export const generateUnstarToken = (
  userId: string,
  fullName: string,
): string => {
  const payload = `${userId}:${fullName}`;
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = computeHMAC(payload);
  return `${encoded}.${signature}`;
};

export const verifyUnstarToken = (
  token: string,
): { userId: string; fullName: string } | null => {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  try {
    const payload = Buffer.from(encoded, "base64url").toString();
    if (!payload) return null;

    const colonIndex = payload.indexOf(":");
    if (colonIndex === -1) return null;

    const isValid = verifyHMAC(payload, signature);
    if (!isValid) return null;

    const userId = payload.slice(0, colonIndex);
    const fullName = payload.slice(colonIndex + 1);

    if (!userId || !fullName) return null;

    return { userId, fullName };
  } catch {
    return null;
  }
};
