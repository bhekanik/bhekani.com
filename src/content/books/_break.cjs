const fs = require("fs");
const path = require("path");

// read the json file at ./books.json loop over each book and write it to ./<title>.md where <title> is the title of the book
const books = require("./_books.json");

// change date format from yyyyMMdd to yyyy-mm-dd
const transformDate = (date) => {
  // if date is not defined return today
  if (!date) return new Date().toISOString().substring(0, 10);

  const year = date.substring(0, 4);
  const month = date.substring(4, 6);
  const day = date.substring(6, 8);
  return `${year}-${month}-${day}`;
};

books.forEach((book) => {
  const body = `---
id: ${book.id}
title: "${book.title?.toString()}"
author: ${book.author}
authorLF: ${book.authorLF}
additionalAuthors: ${book.additionalAuthors}
ISBN: "${book.ISBN?.toString()}"
ISBN13: "${book.ISBN13?.toString()}"
myRating: ${book.myRating}
averageRating: ${book.averageRating}
publisher: ${book.publisher}
binding: ${book.binding}
numberOfPages: ${book.numberOfPages}
yearPublished: "${book.yearPublished?.toString()}"
originalPublicationYear: "${book.originalPublicationYear?.toString()}"
dateRead: "${transformDate(book.dateRead?.toString())}"
dateAdded: "${transformDate(book.dateAdded?.toString())}"
bookshelves: ${book.bookshelves}
bookshelvesWithPositions: ${book.bookshelvesWithPositions}
exclusiveShelf: ${book.exclusiveShelf}
myReview: ${book.myReview}
spoiler: ${book.spoiler}
readCount: ${book.readCount}
ownedCopies: ${book.ownedCopies}
tags: []
---

${book.privateNotes}`;
  fs.writeFileSync(
    path.join(__dirname, `${book.title.toLowerCase().replace(" ", "-")}.md`),
    body,
    { encoding: "utf8", flag: "w" },
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
});
