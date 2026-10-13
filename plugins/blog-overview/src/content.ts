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
	const featured = cursor ? undefined : (eligible ?? posts[0]);
	const rest = posts.filter(
		(post) => post.data.id !== featured?.data.id && post.data.id !== eligible?.data.id,
	);
	return { featured, rest, topPost: !!eligible && featured === eligible };
}
