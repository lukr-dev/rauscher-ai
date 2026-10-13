import type { APIRoute } from "astro";
import { getSiteSettings, getTaxonomyTerms } from "emdash";
import type { TaxonomyTerm } from "emdash";
import {
	blogFilterPath,
	flattenTerms,
	termTranslations,
} from "../../plugins/blog-overview/src/content";
import { languages, localizedHref } from "../utils/i18n";
import type { Locale } from "../utils/i18n";
import { publicOrigin, urlSetXml } from "../utils/sitemap";
import type { SitemapUrl } from "../utils/sitemap";

export const prerender = false;

/** Category and tag pages that list at least one published post. */
export const GET: APIRoute = async ({ url }) => {
	const origin = publicOrigin((await getSiteSettings()).url, url);
	const urls: SitemapUrl[] = [];
	for (const taxonomy of ["category", "tag"] as const) {
		const termsByLocale = Object.fromEntries(
			await Promise.all(
				languages.map(async ({ code }) => [
					code,
					await getTaxonomyTerms(taxonomy, { locale: code }),
				]),
			),
		) as Record<Locale, TaxonomyTerm[]>;
		const href = (slug: string, locale: string) =>
			`${origin}${localizedHref(blogFilterPath({ taxonomy, slug }), locale)}`;
		for (const { code } of languages)
			for (const term of flattenTerms(termsByLocale[code])) {
				if (!term.count) continue;
				const alternates = Object.entries(termTranslations(term, termsByLocale))
					.filter(([, translation]) => translation.count)
					.map(([locale, translation]) => ({
						hreflang: locale,
						href: href(translation.slug, locale),
					}));
				urls.push({ loc: href(term.slug, code), alternates });
			}
	}
	return new Response(urlSetXml(urls), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
