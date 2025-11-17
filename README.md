# Docsbase

A documentation chat assistant powered by AI.

## Tech Stack

- **Frontend**: TanStack Start, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Convex (real-time database), Clerk (authentication)
- **API**: Cloudflare Workers (Hono framework)
- **AI**: Anthropic Claude, Upstash Vector, Firecrawl
- **Pricing**: Autumn
- **Monitoring**: Sentry, Coderabbit
- **Hosting**: Netlify

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Convex CLI
- Cloudflare Wrangler

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   cd workers-api && pnpm install
   ```

2. **Configure environment variables:**

   - Set up Convex: `npx convex dev`
   - Configure Clerk credentials
   - Add Cloudflare Workers secrets for API keys

3. **Run development servers:**

   ```bash
   # Terminal 1: Main app
   pnpm dev

   # Terminal 2: Workers API
   cd workers-api && pnpm dev
   ```

4. **Access the app:**
   - Frontend: http://localhost:3000
   - Workers API: http://localhost:8787

## Deployment

- **Frontend**: `pnpm build`
- **Workers API**: `cd workers-api && pnpm deploy`
