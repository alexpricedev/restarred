import {
  type DatabaseMutationResult,
  hasAffectedRows,
} from "../utils/database";
import type { User } from "./auth";
import { db } from "./database";

export type { User };

export interface UserPreferences {
  emailOverride: string;
  digestDay: number;
  digestHour: number;
  timezone: string;
  isActive: boolean;
  filterOwnRepos: boolean;
}

export const getUserRole = async (
  userId: string,
): Promise<User["role"] | null> => {
  try {
    const rows = await db`SELECT role FROM users WHERE id = ${userId}`;
    if (rows.length === 0) return null;
    return rows[0].role as User["role"];
  } catch {
    return null;
  }
};

export const getUsers = async (): Promise<User[]> => {
  const results = await db`
    SELECT * FROM users
    ORDER BY created_at DESC
  `;
  return results as User[];
};

export const updateUserPreferences = async (
  userId: string,
  prefs: UserPreferences,
): Promise<User> => {
  const emailOverride = prefs.emailOverride.trim() || null;

  const result = await db`
    UPDATE users SET
      email_override = ${emailOverride},
      digest_day = ${prefs.digestDay},
      digest_hour = ${prefs.digestHour},
      timezone = ${prefs.timezone},
      is_active = ${prefs.isActive},
      filter_own_repos = ${prefs.filterOwnRepos},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new Error("User not found");
  }

  return result[0] as User;
};

interface ConsentContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export const recordConsentAndMarkViewed = async (
  userId: string,
  context: ConsentContext,
): Promise<void> => {
  await db`
    UPDATE users SET
      consented_to_emails = true,
      consented_at = CURRENT_TIMESTAMP,
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;

  await db`
    INSERT INTO consent_records (user_id, consent_type, ip_address, user_agent)
    VALUES
      (${userId}, 'email_digest', ${context.ipAddress}, ${context.userAgent}),
      (${userId}, 'terms', ${context.ipAddress}, ${context.userAgent}),
      (${userId}, 'privacy', ${context.ipAddress}, ${context.userAgent})
  `;
};

export const deactivateUser = async (userId: string): Promise<void> => {
  await db`
    UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const result = await db`DELETE FROM users WHERE id = ${userId}`;
  return hasAffectedRows(result as DatabaseMutationResult);
};
