import { z } from "astro:content";

export const bookSchema = () =>
  z.object({
    id: z.number(),
    title: z.string(),
    author: z.string(),
    authorLF: z.string(),
    additionalAuthors: z.string().optional().nullable(),
    ISBN: z.string().optional().nullable(),
    ISBN13: z.string().optional().nullable(),
    myRating: z.number(),
    averageRating: z.number(),
    publisher: z.string().optional().nullable(),
    numberOfPages: z.number().optional().nullable(),
    yearPublished: z.string().optional(),
    originalPublicationYear: z.string().optional().nullable(),
    dateRead: z.string().optional().nullable(),
    dateAdded: z.string(),
    bookshelves: z.string().optional().nullable(),
    exclusiveShelf: z.string().optional(),
    myReview: z.string().optional().nullable(),
    spoiler: z.boolean().optional().nullable(),
    privateNotes: z.string().optional(),
    readCount: z.number().optional(),
    tags: z.array(z.string()),
  });
