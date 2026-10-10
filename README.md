# rauscher.ai

Personal website built from the official [EmDash Cloudflare starter](https://github.com/emdash-cms/templates/tree/main/starter-cloudflare): Astro, EmDash CMS, Cloudflare Workers, D1, and R2. The starter includes posts, pages, categories, tags, search, and the CMS admin. Visual design and personal content come next.

## Branches

`feature/<name>` → `dev` → `main`

Create feature branches from `dev` and merge them back into `dev`. Use `dev` for integration and review previews. Merge approved releases into `main`, the production deployment branch. The initial setup stays on `dev` until the first release.

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
npm run preview -- --ip 127.0.0.1 --port <local-port>
tailscale serve --bg --https=<unused-https-port> http://127.0.0.1:<local-port>
```

Use the HTTPS URL for both the site and CMS setup; passkeys require a secure origin. Preserve existing Serve routes, verify the page and assets via the Tailscale URL, and keep the server running for review. Access stays within the tailnet. Rebuild and restart the preview after source changes.

## Cloudflare deployment (later)

The Worker entry point, D1 `DB` binding, R2 `MEDIA` binding, and scheduled maintenance handler are configured in `wrangler.jsonc` and `src/worker.ts`. No remote resources or deployment automation have been created.

When ready to release, merge `dev` into `main`, use a clean `main` checkout, authenticate Wrangler, configure the production `EMDASH_SITE_URL` variable and `EMDASH_ENCRYPTION_KEY` secret, and run `npm run deploy`. Keep the encryption key stable: changing it prevents existing encrypted values from being read. Wrangler can provision the named D1/R2 resources on first deployment. Complete CMS setup on the production origin.

Future Cloudflare previews must use separate D1/R2 resources and their own site URL and secrets. See the [official Cloudflare deployment guide](https://docs.emdashcms.com/deployment/cloudflare/) for provisioning and preview configuration. Sandboxed plugins can be enabled later if needed on a Workers paid plan.
