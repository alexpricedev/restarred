import { log } from "../services/logger";

const REQUIRED = [
  "DATABASE_URL",
  "CRYPTO_PEPPER",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "ENCRYPTION_KEY",
  "FROM_EMAIL",
  "FROM_NAME",
  "PORT",
  "APP_URL",
  "APP_ORIGIN",
  "EMAIL_PROVIDER",
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.EMAIL_PROVIDER === "resend" && !process.env.RESEND_API_KEY) {
    missing.push("RESEND_API_KEY");
  }

  if (missing.length > 0) {
    log.error("env", `Missing required variables: ${missing.join(", ")}`);
    log.error(
      "env",
      "Set these in your .env file or environment before starting the server",
    );
    process.exit(1);
  }

  log.info("env", "Environment variables validated");
}
