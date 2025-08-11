# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and blog for Bhekani built with Astro, featuring blog posts, book reviews, projects showcase, and micro posts. The site uses static generation with Vercel deployment and includes view tracking, commenting system, and webmentions.

## Key Commands

```bash
# Development
bun run dev          # Start development server
bun run start        # Alias for dev server

# Build & Production
bun run build        # Lint, sync, and build for production (sets ASTRO_DATABASE_FILE)
bun run preview      # Preview production build

# Code Quality
bun run lint         # Run Astro checks
```

## Architecture

### Technology Stack
- **Framework**: Astro 5 with static output
- **Styling**: Tailwind CSS 3 with Typography plugin
- **Database**: SQLite via Astro DB (for view counts)
- **Package Manager**: Bun (migrated from pnpm)
- **Deployment**: Vercel
- **Comments**: Giscus (GitHub Issues)
- **Monitoring**: Sentry

### Content Collections
Located in `src/content/`:
- **posts**: Blog posts (Markdown/MDX)
- **books**: Book reviews with ratings
- **projects**: Project showcases (JSON data)
- **micro**: Short-form posts
- **webmentions**: External mentions data

### Database Schema
Single `Views` table tracking page view counts:
- `slug` (text, primary key)
- `count` (number, default: 1)

### API Routes
- `/api/views`: GET/POST endpoints for view tracking (server-rendered)

### Page Structure
- `/posts/[...slug]`: Individual blog posts with ToC, comments, webmentions
- `/books/[...slug]`: Book reviews with metadata
- `/micro/[...slug]`: Micro posts
- `/projects`: Project gallery
- Tag pages for posts and books at `/[type]/tags/[tag]`

### Key Components
- **ViewCounter**: Svelte component for real-time view tracking
- **Giscuss**: GitHub Issues-based commenting
- **TableOfContents**: Auto-generated from headings
- **WebMentions**: External mention aggregation

### Development Workflow
- Git hooks via Husky run lint-staged on pre-commit
- Lint-staged runs `bun run lint` on staged JS/TS/TSX/Astro files
- Expressive Code for syntax highlighting with word wrap enabled
- PostHog analytics integration

## Important Notes

- The site is production with active users - exercise caution with changes
- Database file path must be set during build: `ASTRO_DATABASE_FILE=./db.sqlite`
- Sentry is configured for production error tracking
- All content uses frontmatter schemas defined in `src/content/_schemas/`
- Static site generation with Vercel adapter configured