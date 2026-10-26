export type LibraryBook = {
  id: string
  ISBN?: string | null
  ISBN13?: string | null
  dateAdded?: string | Date | null
  exclusiveShelf?: string | null
  myRating?: number | null
  myReview?: string | null
  tags?: string[] | null
}

export type LibraryStats = {
  total: number
  read: number
  reading: number
  toRead: number
  rated: number
  reviewed: number
  averageRating: number | null
}

export function getValidRating(rating: number | null | undefined): number | undefined {
  return rating !== null && rating !== undefined && Number.isFinite(rating) && rating > 0 && rating <= 5
    ? rating
    : undefined
}

export function summarizeBooks(books: LibraryBook[]): LibraryStats {
  const ratings = books.flatMap((book) => {
    const rating = getValidRating(book.myRating)
    return rating === undefined ? [] : [rating]
  })

  return {
    total: books.length,
    read: books.filter((book) => book.exclusiveShelf === "read").length,
    reading: books.filter((book) => book.exclusiveShelf === "currentlyreading").length,
    toRead: books.filter((book) => book.exclusiveShelf === "toread").length,
    rated: ratings.length,
    reviewed: books.filter((book) => Boolean(book.myReview?.trim())).length,
    averageRating:
      ratings.length === 0
        ? null
        : Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10,
  }
}

export function getAddedDate(date: string | Date | null | undefined): Date | undefined {
  if (date instanceof Date) {
    return Number.isNaN(date.valueOf()) ? undefined : new Date(date)
  }

  if (!date) return undefined

  const datePart = date.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return undefined

  const parsed = new Date(date)
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== datePart ? undefined : parsed
}

export function groupBooksByAddedYear<T extends LibraryBook>(books: T[]) {
  const groups = new Map<number, T[]>()
  const unknown: T[] = []

  for (const book of books) {
    const date = getAddedDate(book.dateAdded)
    if (!date) {
      unknown.push(book)
      continue
    }

    const year = date.getUTCFullYear()
    groups.set(year, [...(groups.get(year) ?? []), book])
  }

  return [
    ...[...groups.entries()]
      .sort(([firstYear], [secondYear]) => secondYear - firstYear)
      .map(([year, groupedBooks]) => ({
        label: `Added to log in ${year}`,
        books: groupedBooks,
      })),
    ...(unknown.length === 0 ? [] : [{ label: "Date unknown", books: unknown }]),
  ]
}

export function sortBooksByAddedDate<T extends LibraryBook>(books: T[]): T[] {
  return [...books].sort((first, second) => {
    const firstDate = getAddedDate(first.dateAdded)?.valueOf() ?? Number.NEGATIVE_INFINITY
    const secondDate = getAddedDate(second.dateAdded)?.valueOf() ?? Number.NEGATIVE_INFINITY
    return secondDate - firstDate
  })
}

export function getBookTags(books: LibraryBook[]): string[] {
  return [...new Set(books.flatMap((book) => book.tags ?? []).filter(Boolean))].sort()
}

export function getValidIsbn(...values: Array<string | null | undefined>): string | undefined {
  for (const sourceValue of values) {
    const value = sourceValue?.replace(/[\s-]/g, "").toUpperCase()
    if (value && isValidIsbn(value)) return value
  }
}

function isValidIsbn(value: string): boolean {
  if (/^\d{13}$/.test(value)) {
    return value.split("").reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0) % 10 === 0
  }

  if (/^\d{9}[\dX]$/.test(value)) {
    return value.split("").reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0) % 11 === 0
  }

  return false
}
