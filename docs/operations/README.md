# Find a maintenance procedure

Choose the guide for the surface you are changing. These are repository-maintainer docs; this project has no separate docs website.

| Task | Guide |
| --- | --- |
| Submit, inspect, approve or reject native comments; maintain shared hearts | [Native interactions](native-social-interactions.md) |
| Copy or export writing; understand optional automated-reader feedback | [Machine-readable writing](machine-readable-writing-feedback.md) |
| Preserve blog RSS identifiers and canonical export URLs | [Syndication](syndication.md) |
| Maintain title-optional Micro notes and their feed actions | [Micro](micro.md) |
| Generate static share cards with bundled fonts | [Open Graph images](open-graph.md) |
| Maintain deployment-local keyword and optional semantic search | [Search](search.md) |
| Check contents, reading progress and Giscus navigation | [Reading](reading.md) |
| Maintain aggregate views and browser collection settings | [Privacy and views](privacy-and-views.md) |
| Test storage-safe theme, edition and feedback preferences | [Preferences](preferences.md) |
| Preserve book routes, shelf labels and reading statistics | [Library](library.md) |
| Keep project descriptions consistent | [Projects](projects.md) |
| Maintain plain About facts | [About](about-facts.md) |
| Review dependency pins, runtime requirements and advisory holds | [Dependencies](dependency-maintenance.md) |

Start local verification from the repository root:

```sh
bun run verify:offline
```

This resets ignored `.astro/verify.db` and rebuilds generated output. Keep any moderation fixtures you need to retain in a separate explicitly named local database. Use `bun run build` only for an authorized deployment: its prebuild can publish embeddings and its Astro build uses remote DB configuration. Neither command proves a production user journey by itself.
