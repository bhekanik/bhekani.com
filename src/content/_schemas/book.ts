import { z } from "astro:content";

export const bookSchema = () =>
  z.object({
    id: z.number(),
    title: z.string(),
    author: z.string(),
    authorLF: z.string(),
    additionalAuthors: z.array(z.string()).optional(),
    ISBN: z.string().optional(),
    ISBN13: z.string().optional(),
    myRating: z.number(),
    averageRating: z.number(),
    publisher: z.string().optional(),
    numberOfPages: z.number().optional(),
    yearPublished: z.number().optional(),
    originalPublicationYear: z.number().optional(),
    dateRead: z.string().optional(),
    dateAdded: z.string(),
    bookshelves: z.array(z.string()).optional(),
    exclusiveShelf: z.string().optional(),
    myReview: z.string().optional(),
    spoiler: z.boolean().optional(),
    privateNotes: z.string().optional(),
    readCount: z.number().optional(),
    tags: z.array(z.string()),
  });
