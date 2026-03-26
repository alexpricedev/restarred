import { computeHMAC, verifyHMAC } from "../utils/crypto";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const generateUnstarToken = (
  userId: string,
  fullName: string,
  now: number = Date.now(),
): string => {
  const payload = `${userId}:${fullName}:${now}`;
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = computeHMAC(payload);
  return `${encoded}.${signature}`;
};

export const verifyUnstarToken = (
  token: string,
  now: number = Date.now(),
): { userId: string; fullName: string } | null => {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  try {
    const payload = Buffer.from(encoded, "base64url").toString();
    if (!payload) return null;

    const lastColonIndex = payload.lastIndexOf(":");
    if (lastColonIndex === -1) return null;

    const isValid = verifyHMAC(payload, signature);
    if (!isValid) return null;

    const timestamp = Number(payload.slice(lastColonIndex + 1));
    if (!timestamp || now - timestamp > TOKEN_TTL_MS) return null;

    const rest = payload.slice(0, lastColonIndex);
    const firstColonIndex = rest.indexOf(":");
    if (firstColonIndex === -1) return null;

    const userId = rest.slice(0, firstColonIndex);
    const fullName = rest.slice(firstColonIndex + 1);

    if (!userId || !fullName) return null;

    return { userId, fullName };
  } catch {
    return null;
  }
};
