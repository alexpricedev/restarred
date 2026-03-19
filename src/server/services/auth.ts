import { randomUUID } from "node:crypto";
import { db } from "./database";

export interface User {
  id: string;
  github_id: number;
  github_username: string;
  github_email: string;
  email_override: string | null;
  github_token: string;
  digest_day: number;
  digest_hour: number;
  timezone: string;
  is_active: boolean;
  role: "user" | "admin";
  sync_status: "idle" | "syncing" | "done" | "error";
  created_at: Date;
  updated_at: Date;
}

export type AuthResult =
  | { success: true; user: User; sessionId: string }
  | { success: false; error: string };

interface GitHubUserInput {
  githubId: number;
  githubUsername: string;
  githubEmail: string;
  encryptedToken: string;
}

export const findOrCreateGitHubUser = async (
  input: GitHubUserInput,
): Promise<User> => {
  const existing = await db`
    SELECT * FROM users WHERE github_id = ${input.githubId}
  `;

  if (existing.length > 0) {
    const updated = await db`
      UPDATE users
      SET github_username = ${input.githubUsername},
          github_email = ${input.githubEmail},
          github_token = ${input.encryptedToken},
          updated_at = CURRENT_TIMESTAMP
      WHERE github_id = ${input.githubId}
      RETURNING *
    `;
    return updated[0] as User;
  }

  const userId = randomUUID();
  const newUser = await db`
    INSERT INTO users (id, github_id, github_username, github_email, github_token)
    VALUES (${userId}, ${input.githubId}, ${input.githubUsername}, ${input.githubEmail}, ${input.encryptedToken})
    RETURNING *
  `;

  return newUser[0] as User;
};

export const cleanupExpired = async (): Promise<void> => {
  await db`
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP
  `;
};
