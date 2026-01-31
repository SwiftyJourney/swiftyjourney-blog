# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` holds Astro routes, split by locale (`en/`, `es/`), with blog routes in `src/pages/**/blog/`.
- `src/layouts/` contains layout shells such as `BaseLayout.astro` and `BlogPost.astro`.
- `src/components/` houses reusable UI pieces (toggles, header/footer, etc.).
- `src/content/blog/` stores posts using a date-based hierarchy: `YYYY/MM/DD/en.md` and `YYYY/MM/DD/es.md`, plus local images.
- `src/styles/` contains global styling (`global.css`) plus Tailwind-driven prose styles.
- Static assets live in `public/` (fonts, logos, partner images). Built output goes to `dist/`.

## Build, Test, and Development Commands
- `npm install` — installs dependencies.
- `npm run dev` — runs the Astro dev server with hot reload.
- `npm run build` — builds the static site into `dist/`.
- `npm run preview` — serves the production build locally.
- `npm run astro -- --help` — Astro CLI help for content/diagnostics.

## Coding Style & Naming Conventions
- Indentation: 2 spaces in `.astro`, `.ts`, and `.css` files (match existing files).
- Keep component and layout names in `PascalCase` (e.g., `ThemeToggle.astro`).
- Post files are named `en.md` and `es.md` inside a date folder. This repo assumes one post per day.
- Frontmatter in `src/content/blog/` must include `title`, `description`, `pubDate`, and `lang`; `slug` sets the URL and `translationKey` links languages.

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
