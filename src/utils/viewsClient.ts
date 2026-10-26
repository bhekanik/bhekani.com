interface ViewCountPayload {
  count?: number
}

export function parseViewCount(value: ViewCountPayload): number | undefined {
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return undefined
  }

  const count = Object.getOwnPropertyDescriptor(value, "count")?.value
  return Number.isSafeInteger(count) && count >= 0
    ? count
    : undefined
}
