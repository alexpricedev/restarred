import { computeHMAC, generateSecureToken } from "../utils/crypto";
import { db } from "./database";
import { getEmailService } from "./email";
import { log } from "./logger";

const APP_URL = process.env.APP_URL as string;
const RATE_LIMIT_MS = 5 * 60 * 1000;
const EXPIRY_HOURS = 24;

interface PendingVerification {
  email: string;
  createdAt: Date;
}

interface VerifyResult {
  success: boolean;
  email?: string;
  reason?: "expired" | "invalid";
}

async function cleanupExpired(): Promise<void> {
  await db`DELETE FROM email_verifications WHERE expires_at < NOW()`;
}

export async function createVerification(
  userId: string,
  email: string,
): Promise<void> {
  const existing =
    await db`SELECT created_at FROM email_verifications WHERE user_id = ${userId} AND expires_at > NOW()`;

  if (existing.length > 0) {
    const elapsed =
      Date.now() - new Date(existing[0].created_at as string).getTime();
    if (elapsed < RATE_LIMIT_MS) {
      throw new RateLimitError(
        "Please wait before requesting another verification email.",
      );
    }
  }

  await db`DELETE FROM email_verifications WHERE user_id = ${userId}`;
  await cleanupExpired();

  const token = generateSecureToken(32);
  const tokenHash = computeHMAC(token);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  await db`
		INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
		VALUES (${userId}, ${email}, ${tokenHash}, ${expiresAt})
	`;

  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await getEmailService().send({
    to: { email },
    from: {
      email: process.env.FROM_EMAIL as string,
      name: process.env.FROM_NAME as string,
    },
    subject: "Verify your email for re:starred",
    html: `<p>Click the link below to confirm your email address for re:starred digest delivery:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>This link expires in ${EXPIRY_HOURS} hours.</p>`,
    text: `Confirm your email address for re:starred digest delivery:\n\n${verifyUrl}\n\nThis link expires in ${EXPIRY_HOURS} hours.`,
  });

  log.info(
    "email-verification",
    `Verification email sent to ${email} for user ${userId}`,
  );
}

export async function verifyToken(token: string): Promise<VerifyResult> {
  if (!token) return { success: false, reason: "invalid" };

  await cleanupExpired();

  const tokenHash = computeHMAC(token);
  const rows =
    await db`SELECT user_id, email, expires_at FROM email_verifications WHERE token_hash = ${tokenHash}`;

  if (rows.length === 0) {
    return { success: false, reason: "invalid" };
  }

  const row = rows[0];
  const expiresAt = new Date(row.expires_at as string);

  if (expiresAt < new Date()) {
    await db`DELETE FROM email_verifications WHERE token_hash = ${tokenHash}`;
    return { success: false, reason: "expired" };
  }

  const email = row.email as string;
  const userId = row.user_id as string;

  await db`UPDATE users SET email_override = ${email}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
  await db`DELETE FROM email_verifications WHERE token_hash = ${tokenHash}`;

  log.info("email-verification", `Email verified: ${email} for user ${userId}`);

  return { success: true, email };
}

export async function getPendingVerification(
  userId: string,
): Promise<PendingVerification | null> {
  const rows =
    await db`SELECT email, created_at FROM email_verifications WHERE user_id = ${userId} AND expires_at > NOW()`;

  if (rows.length === 0) return null;

  return {
    email: rows[0].email as string,
    createdAt: new Date(rows[0].created_at as string),
  };
}

export async function cancelPendingVerification(userId: string): Promise<void> {
  await db`DELETE FROM email_verifications WHERE user_id = ${userId}`;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
