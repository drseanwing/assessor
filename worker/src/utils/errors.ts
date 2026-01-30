export function sanitizeError(err: unknown): string {
  if (process.env.NODE_ENV !== "production") {
    return err instanceof Error ? err.message : String(err);
  }
  return "Internal server error";
}
