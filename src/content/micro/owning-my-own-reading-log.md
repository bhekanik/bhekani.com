---
title: "Owning my own reading log"
date: 2024-01-28
published: true
---

I liked [Tom MacWright's take](https://macwright.com/2017/12/11/indieweb-reading) on why he's "leaving" GoodReads and owning his own reading log. I liked it so much, in fact, that I decided to do the same. So I exported all my books from GoodReads. The export comes as a CSV so I found a CSV to JSON convertor online and turned it into JSON. Wrote a little script to split the JSON into individual markdown files for each book. And then created a collection on my Astro site.

I no longer have all the info about the books and the book cover from GoodReads. Fortunately the export comes with an ISBN and I can use that on the Open Library API to fetch the cover if they have it and display it on my site. The rest was html and css and now I have a books section on my site.
