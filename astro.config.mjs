import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { heroPlugin } from "@rauscher-ai/emdash-hero";
import { levelUpPlugin } from "@rauscher-ai/emdash-level-up";
import { commitsPlugin } from "@rauscher-ai/emdash-commits";
import { blogOverviewPlugin } from "@rauscher-ai/emdash-blog-overview";
import { blogPreviewPlugin } from "@rauscher-ai/emdash-blog-preview";
import { activeQuestsPlugin } from "@rauscher-ai/emdash-active-quests";
import { aboutHeroPlugin } from "@rauscher-ai/emdash-about-hero";
import { skillDeckPlugin } from "@rauscher-ai/emdash-skill-deck";
import { careerPlugin } from "@rauscher-ai/emdash-career";
import { inventoryPlugin } from "@rauscher-ai/emdash-inventory";

export default defineConfig({
	output: "server",
	i18n: {
		defaultLocale: "de",
		locales: ["de", "en", "fr"],
	},
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		{
			name: "rauscher-localized-routes",
			hooks: {
				"astro:config:setup": ({ injectRoute }) => {
					for (const locale of ["en", "fr"]) {
						for (const [pattern, entrypoint] of [
							["", "index.astro"],
							["/posts", "posts/index.astro"],
							["/posts/[slug]", "posts/[slug].astro"],
							["/category/[slug]", "category/[slug].astro"],
							["/tag/[slug]", "tag/[slug].astro"],
							["/404", "404.astro"],
							["/[slug]", "[slug].astro"],
						])
							injectRoute({
								pattern: `/${locale}${pattern}`,
								entrypoint: `./src/pages/${entrypoint}`,
							});
					}
				},
			},
		},
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [
				heroPlugin(),
				levelUpPlugin(),
				commitsPlugin(),
				blogPreviewPlugin(),
				blogOverviewPlugin(),
				activeQuestsPlugin(),
				aboutHeroPlugin(),
				skillDeckPlugin(),
				careerPlugin(),
				inventoryPlugin(),
			],
		}),
	],
	devToolbar: { enabled: false },
});
