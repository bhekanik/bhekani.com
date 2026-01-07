# BK's personal site

BK's personal site, using:

- Astro
- Tailwind 3 + Tailwind Typography
- Vercel
- GitHub Issues for comments

## Live URL

See <https://bhekani.com>

## Environment Setup

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Add your environment variables:
   - `SENTRY_DSN`: Your Sentry DSN for error tracking
   - `SENTRY_AUTH_TOKEN`: Sentry auth token for source maps upload

3. For production deployment on Vercel, configure these environment variables in your Vercel project settings
