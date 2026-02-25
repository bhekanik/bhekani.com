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

## Visual Development

### Indie Design Philosophy
REMEMBER: shipping to validate not win design awards
- Good enough UX not frustrating users
- Clean professional look without obsessing over pixels
- Focus on money feature working beautifully
- Everything else just needs to not be broken

### Quick Visual Check
After implementing any front-end change:
1. Does it work - test actual functionality
2. Does it look broken - quick visual scan for obvious issues
3. Is it usable - can users figure it out without instructions
4. Take screenshot - document what shipped
5. Check console - no errors breaking experience

### When to Care More About Design
- Money feature (what users pay for)
- First-time user experience/onboarding
- Payment/checkout flows
- Error states losing user trust

### Design Principles
- /context/design-principles.md - pragmatic design checklist
- /context/style-guide.md - basic brand consistency
- Use as guidelines not gospel

### Design Review (When Needed)
Use design-review agent when:
- Shipping major user-facing feature
- UI feels "off" and need help
- Before Product Hunt launch
- Customer reported UI/UX issues

Remember: ship first, polish based on user feedback

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
