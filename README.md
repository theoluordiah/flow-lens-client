This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Profile Builder

`/profile-builder` (sidebar → Tools) creates a GitHub profile README: a terminal-style
developer card, an optional animated ASCII portrait and a contribution heatmap, exported as
self-contained SVGs plus `README.md` (individually or as one `.zip`).

- **Generation happens in the browser** (`src/lib/profile/`). Photos are converted to ASCII
  on a canvas and are never uploaded or stored; only the generated ASCII text is saved
  with the profile.
- **Contribution data is real**: the backend reads GitHub's GraphQL `contributionCalendar`
  with the user's existing FlowLens sign-in (`GET /api/profile/contributions`). If it can't
  be retrieved, the heatmap is omitted rather than estimated.
- **Saved profiles** live on the backend (`GET/PUT/DELETE /api/profile`); an unsaved draft
  is also kept in `localStorage`.
- **SVG safety**: user text is escaped, links are restricted to `https:`/`http:`/`mailto:`,
  and every SVG is checked (no scripts, event handlers, external references) before preview
  or export. Animations are CSS inside the SVG with a `prefers-reduced-motion` fallback, and
  every animated element is visible in its base style, so non-animating clients show the
  final frame.
- **Daily refresh (optional)**: the export can include `.github/workflows/flowlens-heatmap.yml`
  plus `.github/flowlens/refresh-heatmap.mjs` for the user's profile repo. It re-renders the
  heatmap each day from GitHub's GraphQL API with that repo's own `GITHUB_TOKEN` (public
  calendar only) and leaves the old SVG untouched if GitHub can't be reached.
  The script is the real heatmap renderer bundled by esbuild — after changing
  `src/lib/profile/svg.ts`, run `npm run gen:refresh-script` (a unit test fails if the
  committed bundle is stale).
- FlowLens never commits to the user's GitHub repositories.

No new environment variables. `npm test` runs the generator unit tests (`tsx --test`).
New dev dependencies: `tsx` (tests) and `esbuild` (refresh-script bundling).
