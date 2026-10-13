import type { AstroGlobal } from "astro";
import { decodeSlug, getEmDashEntry, getTaxonomyTermsWithCacheHint } from "emdash";
import type { TaxonomyTerm } from "emdash";
import {
	blogFilterPath,
	blogOverviewNode,
	flattenTerms,
	termTranslations,
} from "../../plugins/blog-overview/src/content";
import type { BlogOverviewNode, BlogTaxonomy } from "../../plugins/blog-overview/src/content";
import { languages, localizedHref, siteLocale } from "./i18n";
import type { Locale } from "./i18n";

export interface BlogFilterPageData {
	taxonomy: BlogTaxonomy;
	term: TaxonomyTerm;
	node: BlogOverviewNode;
	contentLocale: string;
	alternates: Partial<Record<Locale, string>>;
}
/** Resolves a category or tag page; `null` means the term does not exist. */
export async function loadBlogFilter(
	Astro: AstroGlobal,
	taxonomy: BlogTaxonomy,
): Promise<BlogFilterPageData | null> {
	const slug = decodeSlug(Astro.params.slug);
	if (!slug) return null;
	const [page, ...termResults] = await Promise.all([
		getEmDashEntry("pages", "posts", { locale: Astro.currentLocale }),
		...languages.map(({ code }) => getTaxonomyTermsWithCacheHint(taxonomy, { locale: code })),
	]);
	if (Astro.cache?.enabled) {
		Astro.cache.set(page.cacheHint);
		for (const result of termResults) Astro.cache.set(result.cacheHint);
	}
	const contentLocale = page.fallbackLocale ?? Astro.currentLocale ?? "de";
	Astro.locals.contentLocale = contentLocale;
	const termsByLocale = Object.fromEntries(
		languages.map(({ code }, index) => [code, termResults[index]!.data]),
	) as Record<Locale, TaxonomyTerm[]>;
	const term = flattenTerms(termsByLocale[siteLocale(contentLocale)]).find(
		(item) => item.slug === slug,
	);
	if (!term) return null;
	const alternates: Partial<Record<Locale, string>> = {};
	for (const [code, translation] of Object.entries(termTranslations(term, termsByLocale)))
		alternates[code as Locale] = localizedHref(
			blogFilterPath({ taxonomy, slug: translation.slug }),
			code,
		);
	return {
		taxonomy,
		term,
		node: blogOverviewNode(page.entry?.data.content) ?? {},
		contentLocale,
		alternates,
	};
}
