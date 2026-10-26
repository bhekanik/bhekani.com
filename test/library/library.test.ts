import { createHash } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import matter from "gray-matter"
import { describe, expect, it } from "vitest"
import {
  getAddedDate,
  getBookTags,
  getValidIsbn,
  groupBooksByAddedYear,
  summarizeBooks,
  type LibraryBook,
} from "../../src/utils/library"

const booksDirectory = resolve(import.meta.dirname, "../../src/content/books")

function sourceBooks(): LibraryBook[] {
  return readdirSync(booksDirectory)
    .filter((filename) => filename.endsWith(".md"))
    .sort()
    .map((filename) => ({
      id: filename.slice(0, -3),
      ...matter(readFileSync(resolve(booksDirectory, filename), "utf8")).data,
    }))
}

describe("library statistics", () => {
  it("counts the owned library without treating an unrated book as a zero-star opinion", () => {
    const books = sourceBooks()
    const readBooks = books.filter((book) => book.exclusiveShelf === "read")

    expect(summarizeBooks(books)).toMatchObject({
      total: 111,
      read: 61,
      reading: 14,
      toRead: 36,
      reviewed: 25,
    })
    expect(summarizeBooks(readBooks)).toMatchObject({
      total: 61,
      rated: 53,
      reviewed: 25,
      averageRating: 4.1,
    })
  })

  it("handles no books, unrated books, and invalid ratings honestly", () => {
    expect(summarizeBooks([])).toEqual({
      total: 0,
      read: 0,
      reading: 0,
      toRead: 0,
      rated: 0,
      reviewed: 0,
      averageRating: null,
    })

    expect(
      summarizeBooks([
        { id: "unrated", exclusiveShelf: "read", myRating: 0 },
        { id: "invalid", exclusiveShelf: "read", myRating: 6 },
        { id: "rated", exclusiveShelf: "read", myRating: 4 },
      ]),
    ).toMatchObject({ rated: 1, averageRating: 4 })
  })
})

describe("library dates", () => {
  it("labels only valid added-to-log dates and leaves invalid or absent dates unknown", () => {
    expect(
      groupBooksByAddedYear([
        { id: "known", dateAdded: "2024-02-29" },
        { id: "synthetic", dateAdded: "not-a-date" },
        { id: "missing" },
      ]),
    ).toEqual([
      { label: "Added to log in 2024", books: [{ id: "known", dateAdded: "2024-02-29" }] },
      {
        label: "Date unknown",
        books: [
          { id: "synthetic", dateAdded: "not-a-date" },
          { id: "missing" },
        ],
      },
    ])
  })

  it("retains a valid content-loader date without inferring a replacement date", () => {
    const importedDate = new Date("2024-02-29T00:00:00.000Z")
    expect(getAddedDate(importedDate)).toEqual(importedDate)
    expect(getAddedDate("2024-02-29T00:00:00.000Z")).toEqual(importedDate)
  })
})

describe("ISBN actions", () => {
  it.each([
    ["ISBN-10", ["0-306-40615-2"], "0306406152"],
    ["ISBN-10 with X", ["0-8044-2957-X"], "080442957X"],
    ["ISBN-10 with lowercase x", ["0-8044-2957-x"], "080442957X"],
    ["ISBN-13", ["978-0-306-40615-7"], "9780306406157"],
    ["invalid checksum", ["9780306406158"], undefined],
    ["literal undefined", ["undefined"], undefined],
    ["missing", [undefined, null], undefined],
  ])("keeps %s out of provider URLs unless it has a valid checksum", (_label, values, expected) => {
    expect(getValidIsbn(...values)).toBe(expected)
  })
})

describe("book taxonomy", () => {
  it("derives tags from books only and keeps the read shelf as the index source", () => {
    const books = [
      { id: "read-book", exclusiveShelf: "read", tags: ["book-only"] },
      { id: "to-read-book", exclusiveShelf: "toread", tags: ["later"] },
    ]
    const postOnlyTags = ["post-only"]

    expect(getBookTags(books.filter((book) => book.exclusiveShelf === "read"))).toEqual(["book-only"])
    expect(getBookTags(books)).not.toContain(postOnlyTags[0])

    const tagRoute = readFileSync(resolve(import.meta.dirname, "../../src/pages/books/tags/[tag].astro"), "utf8")
    expect(tagRoute).toContain('getCollection("books")')
    expect(tagRoute).not.toContain('getCollection("posts")')
  })
})

describe("book source integrity", () => {
  it("preserves all existing route IDs, personal fields, and bodies", () => {
    const records = readdirSync(booksDirectory)
      .filter((filename) => filename.endsWith(".md"))
      .sort()
      .map((filename) => {
        const { data, content } = matter(readFileSync(resolve(booksDirectory, filename), "utf8"))
        return {
          id: String(data.id),
          personal: {
            dateAdded: data.dateAdded,
            dateRead: data.dateRead,
            exclusiveShelf: data.exclusiveShelf,
            myRating: data.myRating,
            myReview: data.myReview,
          },
          bodyHash: createHash("sha256").update(content).digest("hex"),
        }
      })

    const digest = (value: string) => createHash("sha256").update(value).digest("hex")

    expect(records).toHaveLength(111)
    expect(new Set(records.map(({ id }) => id)).size).toBe(111)
    expect(digest(JSON.stringify(records.map(({ id }) => id)))).toBe("fbba808df0456d0b00c4b49a97081e77e496f89c57d9b1f7edf79ae19d9cce32")
    expect(digest(JSON.stringify(records.map(({ personal }) => personal)))).toBe("8dce232c33e4abeac3546b18c26dd2025e3ecaad0c6d52e67fe94383695d1702")
    expect(digest(JSON.stringify(records.map(({ bodyHash }) => bodyHash)))).toBe("aa26d4789f6654954711288e8e3f00ae02cc3386e5557b5cb6ce74fd8821f221")
  })
})
