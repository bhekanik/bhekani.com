---
title: "Using connection pooled URL with Supabase and Prisma"
date: 2024-01-28
published: true
---

If you ever encounter this error while trying to run a migration with prisma on your supabase database:

```bash
Error: Schema engine error:
ERROR: prepared statement "s0" does not exist
```

You're likely using the wrong URL to connect to your database. Prisma needs a different URL for doing migrations if your normal database URL uses connection pooling. For more information, see [this article for a more comprehensive guide](https://supabase.com/partners/integrations/prisma)
