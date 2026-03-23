export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visibleLocal =
    local.length <= 2
      ? "*"
      : `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}`;
  return `${visibleLocal}@${domain}`;
}

export const log = {
  info(category: string, message: string): void {
    console.log(`[INFO] [${category}] ${message}`);
  },

  warn(category: string, message: string): void {
    console.warn(`[WARN] [${category}] ${message}`);
  },

  error(category: string, message: string): void {
    console.error(`[ERROR] [${category}] ${message}`);
  },
};
