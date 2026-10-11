import type { ContentEntry, PortableTextBlock, TaxonomyTerm } from "emdash";

export interface BlogPost {
	id: string;
	title: string;
	content?: PortableTextBlock[];
	excerpt?: string;
	project_status?: string;
	publishedAt: Date | null;
	terms?: Record<string, TaxonomyTerm[]>;
}
export function flattenTerms(terms: TaxonomyTerm[]): TaxonomyTerm[] {
	return terms.flatMap((term) => [term, ...flattenTerms(term.children ?? [])]);
}
export function featuredPosts<
	T extends { id: string; status: string; terms?: Record<string, { slug: string }[]> },
>(
	posts: ContentEntry<T>[],
	highlight: ContentEntry<T> | null,
	cursor?: string,
	category?: string,
	tag?: string,
) {
	const eligible =
		highlight?.data.status === "published" &&
		(!category || highlight.data.terms?.category?.some((term) => term.slug === category)) &&
		(!tag || highlight.data.terms?.tag?.some((term) => term.slug === tag))
			? highlight
			: null;
	const featured = cursor ? undefined : (eligible ?? posts[0]);
	const rest = posts.filter(
		(post) => post.data.id !== featured?.data.id && post.data.id !== eligible?.data.id,
	);
	return { featured, rest, highlighted: !!eligible && featured === eligible };
}
