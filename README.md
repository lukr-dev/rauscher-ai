# rauscher.ai

Personal website built from the official [EmDash Cloudflare starter](https://github.com/emdash-cms/templates/tree/main/starter-cloudflare): Astro, EmDash CMS, Cloudflare Workers, D1, and R2.

## Homepage blocks

The homepage renders the published `pages/home` entry. Its rich-text editor offers five separately installed native plugins under **Rauscher.ai**: Hero, Level Up, Commits, Blog Preview, and Active Quests. Add, edit, remove, and reorder these blocks in the page content.

- Hero keeps the greeting/name fixed. Intro and card backs use rich text. Cards can be added/removed; title and photo are required, rarity and special ability are optional. Completion copy and link are editable.
- Level Up has its own heading, rich-text intro, highlights, and button.
- Commits takes a GitHub username, heading, and description. It retrieves contribution activity through the public `github-contributions-api.jogruber.de` proxy; outages display an unavailable message. Contributions include more than commits.
- Blog Preview shows the latest three published posts, their CMS publication dates, and reading time calculated at 200 words/minute. The existing post `excerpt` field is labeled **Preview intro**. Without one, the first two sentences of content are used; CSS limits previews to three lines.
- Active Quests has editable category, title, description, status, since text, external link/label, and an optional published post selected from the CMS.

`seed/seed.json` contains the design's homepage content and three short example posts. Load sample content during initial CMS setup; changing this file does not overwrite an existing site's content. Photos from the design are in `public/media/hero/`.

EmDash 1.2.0 needs a small admin patch for styled rich-text fields, image objects, required fields, optional select clearing, icon pickers, and blocks without fields. `npm ci` applies `patches/emdash-admin-1.2.0.patch` through the version-checked postinstall script. Review/update the patch before upgrading EmDash. Run `npm test` for the block logic tests.

## About blocks

The published `pages/about` entry uses four separate plugins: About Hero, Skill Deck, Career, and Inventory. Each has an editable heading and rich-text introduction.

- About Hero has role/location badges, contact links, photo and card name. Its back is rich text with optional special ability copy. There is no rarity or front counter.
- Skill Deck has reorderable groups and skills, optional proficiency text and optional six-segment levels.
- Career has reorderable roles/qualifications, organisation, date range, job/education type, current marker, and repeatable bullet points.
- Inventory has tool names, categories and optional brand icons picked from the [CoreUI Brands](https://icones.js.org/collection/cib) set (CC0, via `@iconify-json/cib`). The editor searches the set by name and previews each icon; the block stores only the icon name. When no brand fits, upload a custom logo instead; it is shown only if no brand icon is selected. Filters come from the tools' category text, merging differences in case and whitespace.

The seed includes the About design content and `public/media/about/p01.jpg`. Existing CMS content must be updated through the editor/API separately.

`public/styles/rich-text.css` is shared by the site and nested block editors. It applies the section's colours and typography inside the editor; H2 is 60px and yellow on dark sections. The versioned admin patch also initializes nested lists correctly. Review this patch before upgrading EmDash admin from 1.2.0.

## Blog views

The published `pages/posts` entry contains the separate **Blog Overview** plugin, with an editable heading and rich-text introduction. Each post has two independent checkboxes: **Highlight (blue card)** changes its regular card from cream to light blue; **Top Post** makes it eligible for the large dark featured card. The newest published Top Post wins; without one, the newest published post is featured. The selection respects the current language, category and tag filters and can feature a post outside the first page; a filtered page without a matching Top Post shows every match as a regular card. Lists use CMS publication dates and calculated reading time, with pagination after 20 posts. Highlight and Top Post flags are shared across translations.

Each filter is its own server-rendered page: `/category/{slug}` and `/tag/{slug}` (plus `/en/…` and `/fr/…`), with a localized title, description, canonical URL, hreflang links and `CollectionPage` structured data. One filter applies at a time; old `/posts?category=…` and `?tag=…` links redirect permanently. Category and tag badges on cards and articles link to these pages. With JavaScript, filter and pagination links swap the list in place (view transition, history entry, screen-reader announcement); without it they are plain links. A category or tag description entered in the CMS (per language) replaces the generic page intro and meta description. Paginated (`?cursor=`) and empty filter pages are `noindex, follow`. `/sitemap.xml` adds `/sitemap-taxonomies.xml` to EmDash's collection sitemaps, and `/llms.txt` lists categories and posts per language for agents.

For an existing CMS, add these fields before deploying the updated overview:

```bash
# Local development uses dev bypass. Remote sites require EMDASH_TOKEN with schema:write.
node scripts/migrations/002-post-highlights.mjs <site-url>
```

The migration adds missing fields from the seed and can be rerun. It keeps existing posts and leaves both options unchecked. The old page-level highlighted-post picker is replaced by the post-level Top Post checkbox; choose any preferred Top Post in its post editor.

Posts use **Preview intro** (`excerpt`) for card introductions, falling back to the first two sentences of their content. The optional **Project status** field offers _In Arbeit_ and _Abgeschlossen_. Categories group posts, and tags appear as technology badges.

Article pages render the existing post body with the same typography as the editor, generate a contents list from H2/H3 headings, show reading progress, and link to two recent posts. Author details use the CMS byline when supplied. The seed also includes four projects from the design; the CRM example includes the full article. Changing the seed does not migrate an existing CMS: add `project_status`, set the content field's `options.previewClass` to `on-paper copy-article`, and add a Blog Overview block to `pages/posts` through the editor/API.

## Languages

The shared header offers **DE / EN / FR**. German stays at the existing URLs; English uses `/en/` and French `/fr/`. All routes render the same templates, and navigation, controls and internal links follow the selected language. Language links use published translations and their localized slugs; unpublished translations stay hidden. If an article has neither the requested translation nor a German fallback, the switcher returns to the localized blog overview. English/French pages without a published translation show the German content with a notice. A fallback blog page also shows its German post list.

The seed includes English and French translations of the homepage, About page, blog overview and all six existing posts, plus navigation and taxonomy labels. These translations are also published in the local review CMS, linked to their German originals and keeping their publication dates.

Edit each language in the CMS editor's **Translations** panel, and create and publish translations there for new content. Translate the `home` and `posts` pages using those same reserved slugs; other pages and articles can have localized slugs. Translated pages query posts in their own language. Menus, categories and tags can also be translated in EmDash. Later editorial changes are not automatically copied or translated into the other languages.

New installations use `seed/seed.json`'s `defaultLocale: "de"`. The original German-only starter stored German rows with locale `en`; after backing up that original database, run `scripts/migrations/001-german-locale.sql` **before** creating actual English translations. This correction has been applied to the local review preview only; do not run it on a database that already contains English content.

## Branches

`feature/<name>` → `dev` → `main`

Create feature branches from `dev` and merge them back into `dev`. Use `dev` for integration and review previews. Merge approved releases into `main`, the production deployment branch; the merge deploys automatically. The initial setup stays on `dev` until the first release.

```bash
git switch dev
git switch -c feature/my-feature
```

## Development

Use Node.js 24 and npm.

```bash
npm ci
cp .env.example .env
npx emdash secrets generate
```

Paste the generated key into `EMDASH_ENCRYPTION_KEY` in `.env`, then run `npm run dev`. The scaffolder already generated a local key in this checkout; preserve it if `.env` exists. The site runs at `http://localhost:4321`; complete the CMS setup at `/_emdash/admin` and choose whether to load demo content. Local D1/R2 data stays in ignored `.wrangler/` state; no Cloudflare account is needed for development.

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Astro development server                    |
| `npm run preview`      | Preview the built Cloudflare Worker locally |
| `npm run lint`         | Oxlint with warnings treated as failures    |
| `npm run lint:fix`     | Apply safe lint fixes                       |
| `npm run format`       | Oxfmt plus Astro formatting                 |
| `npm run format:check` | Check formatting                            |
| `npm run typecheck`    | Astro and TypeScript diagnostics            |
| `npm run check`        | Formatting, lint, and type checks           |
| `npm run build`        | Production Worker build                     |
| `npm run cf:types`     | Regenerate Cloudflare binding types         |

Oxfmt handles supported source/config/documentation files. `.astro` files use Prettier with `prettier-plugin-astro` until Oxfmt supports them. Oxlint checks scripts; `astro check` also checks Astro files. Generated declarations and the npm lockfile are excluded from formatting. GitHub Actions runs checks and builds for pushes to `dev`/`main` and pull requests targeting either branch.

## Review previews

Discover the current hostname and occupied routes using `tailscale status` and `tailscale serve status`. Copy the local encryption key from `.env` into an ignored `.dev.vars` file and set `EMDASH_SITE_URL` there to the full HTTPS preview URL. Build the site, run the Worker bound to loopback, and expose it on an unused Tailscale Serve HTTPS port:

```bash
npm run build
X_LOCAL_EXPLORER=false npm run preview -- --ip 127.0.0.1 --port <local-port>
tailscale serve --bg --https=<unused-https-port> http://127.0.0.1:<local-port>
```

Use the HTTPS URL for both the site and CMS setup; passkeys require a secure origin. Preserve existing Serve routes, verify the page and assets via the Tailscale URL, and keep the server running for review. Access stays within the tailnet. Rebuild and restart the preview after source changes.

## Cloudflare deployment

The Worker entry point, D1 `DB` binding, R2 `MEDIA` binding, and scheduled maintenance handler are configured in `wrangler.jsonc` and `src/worker.ts`. The deployment targets the **Lukas Rauscher** Cloudflare account and serves `https://rauscher.ai` (`www` redirects to the apex) through Worker routes.

Merging a `dev` → `main` pull request runs `.github/workflows/deploy.yml`, which tests, builds and deploys the merge commit. To redeploy `main` without a release, run **Deploy production** under GitHub Actions (`gh workflow run deploy.yml`). The workflow needs the repository secret `CLOUDFLARE_API_TOKEN`, created from Cloudflare's **Edit Cloudflare Workers** token template for the Lukas Rauscher account and the `rauscher.ai` zone.

Runtime configuration lives on the Worker, not in GitHub: the `EMDASH_SITE_URL` variable (in `wrangler.jsonc`) and the `EMDASH_ENCRYPTION_KEY` and `PLUNK_SECRET_KEY` secrets (`npx wrangler secret put <NAME>`). Keep the encryption key stable: changing it prevents existing encrypted values from being read. For an emergency deployment from a clean `main` checkout, authenticate Wrangler and run `npm run deploy`.

Future Cloudflare previews must use separate D1/R2 resources and their own site URL and secrets. See the [official Cloudflare deployment guide](https://docs.emdashcms.com/deployment/cloudflare/) for provisioning and preview configuration. Sandboxed plugins can be enabled later if needed on a Workers paid plan.

The footer includes muted links to the `impressum` and `datenschutz` CMS pages. Their German content was copied from the existing public website without rewriting; other locales use the normal German fallback until translated.
