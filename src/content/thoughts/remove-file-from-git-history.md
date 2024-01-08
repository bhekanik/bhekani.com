---
title: "How to remove file from Git history"
pubDate: 2024-01-08
description: "Here's how to remove a file from git history"
author: "Bhekani Khumalo"
tags: ["git"]
---

I have googled this enough times for me to keep it in my own notes.

From time to time I find that in my building and carelessly using `git add .` I have added a file or files into git that I shouldn't have had in there in the first place. When this happens I want to delete the file from the git history completely. Maybe there's a better way to do that but this does what I want.

Anyway, the answer to "How to remove file from Git history" that I always use is [here](https://stackoverflow.com/questions/43762338/how-to-remove-file-from-git-history). This is the specific answer I use.

```bash
git filter-branch --index-filter 'git rm -rf --cached --ignore-unmatch path_to_file' HEAD

```
