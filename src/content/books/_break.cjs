const fs = require("fs");
const path = require("path");

// read the json file at ./books.json loop over each book and write it to ./<title>.md where <title> is the title of the book
const books = require("./_books.json");

books.forEach((book) => {
  const body = `---
title: ${book.title}
author: ${book.author}
authorLF: ${book.authorLF}
additionalAuthors: ${book.additionalAuthors}
ISBN: ${book.ISBN}
ISBN13: ${book.ISBN13}
myRating: ${book.myRating}
averageRating: ${book.averageRating}
publisher: ${book.publisher}
binding: ${book.binding}
numberOfPages: ${book.numberOfPages}
yearPublished: ${book.yearPublished}
originalPublicationYear: ${book.originalPublicationYear}
dateRead: ${book.dateRead}
dateAdded: ${book.dateAdded}
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
    "utf8",
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
});
