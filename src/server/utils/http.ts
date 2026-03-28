export const httpFetch = (
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> => fetch(...args);
