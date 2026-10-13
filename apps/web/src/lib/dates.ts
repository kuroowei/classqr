// Converts an ISO date from the API (2025-09-01T00:00:00.000Z) into the
// YYYY-MM-DD value that a date input expects.
export function toDateInput(iso: string): string {
  return iso.slice(0, 10)
}

// Formats an ISO date for display, for example "1 Sep 2025".
// Uses UTC so the day never shifts with the viewer's time zone.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}