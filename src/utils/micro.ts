export function getMicroLabel(title: string | undefined, date: Date): string {
  const trimmed = title?.trim()
  if (trimmed) return trimmed

  return `Micro note — ${new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)}`
}
