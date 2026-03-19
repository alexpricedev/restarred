import type { VisitorStats } from "../services/analytics";

export const createMockVisitorStats = (
  overrides: Partial<VisitorStats> = {},
): VisitorStats => ({
  visitorCount: 1234,
  lastUpdated: "2025-09-12T10:00:00.000Z",
  ...overrides,
});
