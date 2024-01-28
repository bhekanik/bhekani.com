---
title: "Clean up merged branches"
date: 2024-01-28
published: true
---

I use the following to clean up merged branches from remote:

```bash
git fetch -p && for branch in $(git for-each-ref --format "%(refname) %(upstream:track)" refs/heads | awk '$2 == "[gone]" {sub("refs/heads/", "", $1); print $1}'); do git branch -D $branch; done
```
