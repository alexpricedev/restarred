import { computeHMAC, verifyHMAC } from "../utils/crypto";

export const generateUnsubscribeToken = (userId: string): string => {
  const encoded = Buffer.from(userId).toString("base64url");
  const signature = computeHMAC(userId);
  return `${encoded}.${signature}`;
};

export const verifyUnsubscribeToken = (token: string): string | null => {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  try {
    const userId = Buffer.from(encoded, "base64url").toString();
    if (!userId) return null;

    const isValid = verifyHMAC(userId, signature);
    return isValid ? userId : null;
  } catch {
    return null;
  }
};
