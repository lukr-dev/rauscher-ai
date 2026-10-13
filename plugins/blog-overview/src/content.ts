import type { ContentEntry, PortableTextBlock, TaxonomyTerm } from "emdash";

export interface BlogPost {
	id: string;
	title: string;
	content?: PortableTextBlock[];
	excerpt?: string;
	project_status?: string;
	highlight?: boolean;
	top_post?: boolean;
	publishedAt: Date | null;
	terms?: Record<string, TaxonomyTerm[]>;
}
export function flattenTerms(terms: TaxonomyTerm[]): TaxonomyTerm[] {
	return terms.flatMap((term) => [term, ...flattenTerms(term.children ?? [])]);
}
export function featuredPosts<
	T extends {
		id: string;
		status: string;
		top_post?: boolean;
		terms?: Record<string, { slug: string }[]>;
	},
>(
	posts: ContentEntry<T>[],
	topPost: ContentEntry<T> | null,
	cursor?: string,
	category?: string,
	tag?: string,
) {
	const eligible =
		topPost?.data.status === "published" &&
		topPost.data.top_post === true &&
		(!category || topPost.data.terms?.category?.some((term) => term.slug === category)) &&
		(!tag || topPost.data.terms?.tag?.some((term) => term.slug === tag))
			? topPost
			: null;
	// Filtered lists only feature a matching Top Post; otherwise every match is a regular card.
	const featured = cursor ? undefined : (eligible ?? (category || tag ? undefined : posts[0]));
	const rest = posts.filter(
		(post) => post.data.id !== featured?.data.id && post.data.id !== eligible?.data.id,
	);
	return { featured, rest, topPost: !!eligible && featured === eligible };
}

export type BlogTaxonomy = "category" | "tag";
export interface BlogFilter {
	taxonomy: BlogTaxonomy;
	term: TaxonomyTerm;
}
export interface BlogOverviewNode {
	heading?: string;
	intro?: PortableTextBlock[];
}
/** Unlocalized path of the post list, optionally narrowed to one taxonomy term. */
export function blogFilterPath(
	filter?: { taxonomy: BlogTaxonomy; slug: string },
	cursor?: string,
): string {
	const path = filter ? `/${filter.taxonomy}/${encodeURIComponent(filter.slug)}` : "/posts";
	return cursor ? `${path}?cursor=${encodeURIComponent(cursor)}` : path;
}
/** Maps legacy `/posts?category=…&tag=…` links to their single-filter page. */
export function legacyFilterPath(params: URLSearchParams): string | undefined {
	const category = params.get("category");
	const tag = params.get("tag");
	if (category) return blogFilterPath({ taxonomy: "category", slug: category });
	if (tag) return blogFilterPath({ taxonomy: "tag", slug: tag });
	return undefined;
}
/** Settings of the Blog Overview block placed on the `posts` page. */
export function blogOverviewNode(blocks: unknown): BlogOverviewNode | undefined {
	if (!Array.isArray(blocks)) return undefined;
	return blocks.find(
		(block): block is BlogOverviewNode =>
			typeof block === "object" && block?._type === "rauscher-blog-overview",
	);
}
/** The same term in each locale, matched through its translation group. */
export function termTranslations<L extends string>(
	term: TaxonomyTerm,
	termsByLocale: Record<L, TaxonomyTerm[]>,
): Partial<Record<L, TaxonomyTerm>> {
	const group = term.translationGroup ?? term.id;
	const result: Partial<Record<L, TaxonomyTerm>> = {};
	for (const locale of Object.keys(termsByLocale) as L[]) {
		const match = flattenTerms(termsByLocale[locale]).find(
			(item) => (item.translationGroup ?? item.id) === group,
		);
		if (match) result[locale] = match;
	}
	return result;
}
export interface BlogListJsonLd {
	url: string;
	name: string;
	description?: string;
	locale: string;
	siteUrl: string;
	breadcrumbs: { name: string; url: string }[];
	posts: { url: string; name: string; datePublished?: string }[];
}
/** CollectionPage graph so search engines and agents can read the list without rendering it. */
export function blogListJsonLd(page: BlogListJsonLd) {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "CollectionPage",
				"@id": page.url,
				url: page.url,
				name: page.name,
				...(page.description ? { description: page.description } : {}),
				inLanguage: page.locale,
				isPartOf: { "@type": "WebSite", url: page.siteUrl },
				breadcrumb: { "@id": `${page.url}#breadcrumb` },
				mainEntity: {
					"@type": "ItemList",
					numberOfItems: page.posts.length,
					itemListElement: page.posts.map((post, index) => ({
						"@type": "ListItem",
						position: index + 1,
						item: {
							"@type": "BlogPosting",
							"@id": post.url,
							url: post.url,
							headline: post.name,
							...(post.datePublished ? { datePublished: post.datePublished } : {}),
						},
					})),
				},
			},
			{
				"@type": "BreadcrumbList",
				"@id": `${page.url}#breadcrumb`,
				itemListElement: page.breadcrumbs.map((crumb, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: crumb.name,
					item: crumb.url,
				})),
			},
		],
	};
}
