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
