import type { APIRoute } from "astro";
import { getEmDashCollection, getSiteSettings, getTaxonomyTerms } from "emdash";
import { postPreview } from "@rauscher-ai/emdash-blog-preview/preview";
import { blogFilterPath, flattenTerms } from "../../plugins/blog-overview/src/content";
import { languages, localizedHref } from "../utils/i18n";
import { resolveStarterSiteIdentity } from "../utils/site-identity";
import { publicOrigin } from "../utils/sitemap";

export const prerender = false;

const inline = (text: string) => text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();

/** Markdown index of the site for language models and agents (llmstxt.org). */
export const GET: APIRoute = async ({ url }) => {
	const settings = await getSiteSettings();
	const { siteTitle, siteTagline } = resolveStarterSiteIdentity(settings);
	const origin = publicOrigin(settings.url, url);
	const link = (path: string, locale: string) => `${origin}${localizedHref(path, locale)}`;
	const sections = await Promise.all(
		languages.map(async ({ code, name }) => {
			const [posts, categories] = await Promise.all([
				getEmDashCollection("posts", {
					status: "published",
					locale: code,
					orderBy: { published_at: "desc" },
					limit: 100,
				}),
				getTaxonomyTerms("category", { locale: code }),
			]);
			return [
				`## ${name}`,
				"",
				`- [Blog](${link("/posts", code)})`,
				...flattenTerms(categories)
					.filter((term) => term.count)
					.map(
						(term) =>
							`- [${inline(term.label)}](${link(blogFilterPath({ taxonomy: "category", slug: term.slug }), code)}): ${term.count} ${term.count === 1 ? "post" : "posts"}`,
					),
				"",
				"### Posts",
				"",
				...posts.entries.map((entry) => {
					const { intro } = postPreview(entry.data.content, entry.data.excerpt);
					const date = entry.data.publishedAt?.toISOString().slice(0, 10);
					return `- [${inline(entry.data.title)}](${link(`/posts/${entry.id}`, code)})${
						date ? ` (${date})` : ""
					}${intro ? `: ${inline(intro)}` : ""}`;
				}),
			].join("\n");
		}),
	);
	const body = [
		`# ${siteTitle}`,
		"",
		`> ${inline(siteTagline)}`,
		"",
		`German is the default language; English pages live under ${origin}/en/ and French pages under ${origin}/fr/. Every listed page is server-rendered HTML. Full URL list: ${origin}/sitemap.xml`,
		"",
		...sections.flatMap((section) => [section, ""]),
	].join("\n");
	return new Response(body, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
