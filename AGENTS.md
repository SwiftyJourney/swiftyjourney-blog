# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` holds Astro routes, split by locale (`en/`, `es/`). The blog listing is at `/{lang}/` (hero + paginated list), `/{lang}/page/[page]/` for subsequent pages, and individual posts at `/{lang}/blog/[slug]/`.
- `src/layouts/` contains layout shells: `BaseLayout.astro` (chrome) and `BlogPost.astro` (article).
- `src/components/` houses reusable editorial primitives (`ArticleRow`, `ArticleList`, `Meta`, `Tag`, `HeroBlog`, `Button`, `SectionHeading`), chrome (`LangToggle`, `SEO`), and in-post content pieces (`Callout`, `InfoBox`, visualizers under `blog/`).
- `src/content/blog/` stores posts using a date-based hierarchy: `YYYY/MM/DD/en.{md,mdx}` and `YYYY/MM/DD/es.{md,mdx}`.
- `src/styles/global.css` defines design tokens via `@theme` (coral accent, cream background, Inter), plus `.prose` and code-block styles. The site is light-only.
- Static assets live in `public/` (Inter fonts, `logo.svg`, favicon, partner images). Built output goes to `dist/`.

## Build, Test, and Development Commands
- `npm install` — installs dependencies.
- `npm run dev` — runs the Astro dev server with hot reload.
- `npm run build` — builds the static site into `dist/`.
- `npm run preview` — serves the production build locally.
- `npm run astro -- --help` — Astro CLI help for content/diagnostics.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in `.astro`, `.ts`, and `.css` files (match existing files).
- Keep component and layout names in `PascalCase` (e.g., `ArticleRow.astro`).
- Post files are named `en.{md,mdx}` and `es.{md,mdx}` inside a date folder. This repo assumes one post per day.
- Frontmatter in `src/content/blog/` must include `title`, `description`, `pubDate`, and `lang`; `slug` sets the URL and `translationKey` links languages. `heroImage` is part of the schema but is not rendered in the editorial redesign.
- Use coral tokens (`text-accent`, `bg-coral-500`, `border-border`) instead of raw hex or Tailwind zinc/orange. No `dark:` utilities — the site is light-only.

## Testing Guidelines
- No automated tests are configured. Validate changes with `npm run build` and spot-check routes using `npm run preview`.
- For content updates, verify both language URLs (e.g., `/en/blog/slug/` and `/es/blog/slug/`).

## Commit & Pull Request Guidelines
- Commit messages are short, sentence-case, and imperative (e.g., `Fix warnings`). Keep them under ~60 characters.
- PRs should include a brief summary, link any relevant issues, and add screenshots for visual/layout changes.
- Note content updates in the PR description (new posts, translations, or asset additions).

## Configuration & Deployment Notes
- Astro configuration lives in `astro.config.mjs` and content schema in `src/content.config.ts`.
- Vercel deploys from `dist/` with `npm run build`. No runtime environment variables are required.
