export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours > 0) {
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }
  return `${rest}m`;
}