import assert from "node:assert/strict";
import { test } from "node:test";
import {
	blogFilterPath,
	blogListJsonLd,
	blogOverviewNode,
	featuredPosts,
	flattenTerms,
	legacyFilterPath,
	termTranslations,
} from "./content.ts";
import { createPlugin } from "./index.ts";
import type { ContentEntry, TaxonomyTerm } from "emdash";
const post = (id: string, status = "published", category = "data") =>
	({
		id,
		data: { id, status, terms: { category: [{ slug: category }] } },
		edit: {},
	}) as unknown as ContentEntry<{
		id: string;
		status: string;
		terms: { category: { slug: string }[] };
	}>;
test("highlight replaces newest, falls back safely and is not repeated in pagination", () => {
	const posts = [post("new"), post("older")];
	assert.equal(featuredPosts(posts, null).featured?.id, "new");
	const pinned = post("older");
	const result = featuredPosts(posts, pinned);
	assert.equal(result.featured?.id, "older");
	assert.equal(result.highlighted, true);
	assert.deepEqual(
		result.rest.map((p) => p.id),
		["new"],
	);
	assert.equal(featuredPosts(posts, post("draft", "draft")).featured?.id, "new");
	const filtered = featuredPosts(posts, post("other", "published", "career"), undefined, "data");
	assert.equal(filtered.featured, undefined);
	assert.deepEqual(
		filtered.rest.map((p) => p.id),
		["new", "older"],
	);
	assert.equal(featuredPosts(posts, null, undefined, undefined, "tag").featured, undefined);
	const matching = featuredPosts(posts, pinned, undefined, "data");
	assert.equal(matching.featured?.id, "older");
	assert.equal(matching.highlighted, true);
	assert.equal(featuredPosts([], null).featured, undefined);
	assert.equal(featuredPosts(posts, pinned, "next").featured, undefined);
	assert.deepEqual(
		featuredPosts(posts, pinned, "next").rest.map((p) => p.id),
		["new"],
	);
	assert.equal(featuredPosts(posts, post("outside-page")).featured?.id, "outside-page");
});
test("nested categories appear in filters", () => {
	const terms = [
		{ slug: "parent", children: [{ slug: "child", children: [] }] },
	] as unknown as TaxonomyTerm[];
	assert.deepEqual(
		flattenTerms(terms).map((term) => term.slug),
		["parent", "child"],
	);
});
test("highlight picker follows pagination and stores stable post IDs", async () => {
	const handler = createPlugin().routes!.posts.handler;
	const calls: unknown[] = [];
	const ctx = {
		content: {
			list: async (collection: string, options: { cursor?: string }) => {
				calls.push({ collection, ...options });
				return options.cursor
					? { items: [{ id: "id2", slug: "second", data: { title: "Second" } }], hasMore: false }
					: {
							items: [{ id: "id1", slug: "first", data: { title: "First" } }],
							hasMore: true,
							cursor: "next",
						};
			},
		},
	} as unknown as Parameters<typeof handler>[0];
	assert.deepEqual(await handler(ctx), {
		items: [
			{ id: "id1", name: "First" },
			{ id: "id2", name: "Second" },
		],
	});
	assert.equal(calls.length, 2);
});
test("filters use one clean path each and legacy query links map onto them", () => {
	assert.equal(blogFilterPath(), "/posts");
	assert.equal(blogFilterPath(undefined, "a b"), "/posts?cursor=a%20b");
	assert.equal(blogFilterPath({ taxonomy: "category", slug: "daten" }), "/category/daten");
	assert.equal(blogFilterPath({ taxonomy: "tag", slug: "nuxt-js" }, "c"), "/tag/nuxt-js?cursor=c");
	assert.equal(legacyFilterPath(new URLSearchParams("category=daten&tag=x")), "/category/daten");
	assert.equal(legacyFilterPath(new URLSearchParams("tag=nuxt-js&cursor=c")), "/tag/nuxt-js");
	assert.equal(legacyFilterPath(new URLSearchParams("cursor=c")), undefined);
});
test("blog overview settings come from the block on the posts page", () => {
	const node = { _type: "rauscher-blog-overview", heading: "Blog" };
	assert.equal(blogOverviewNode([{ _type: "block" }, node]), node);
	assert.equal(blogOverviewNode([{ _type: "block" }]), undefined);
	assert.equal(blogOverviewNode(undefined), undefined);
});
test("term translations follow the translation group, including the source term", () => {
	const term = (id: string, slug: string, translationGroup: string | null, children = []) =>
		({ id, slug, translationGroup, children }) as unknown as TaxonomyTerm;
	const source = term("de-data", "daten", null);
	const translations = termTranslations(source, {
		de: [term("de-career", "karriere", null), source],
		en: [term("en-parent", "parent", "x", [term("en-data", "data", "de-data")] as never)],
		fr: [term("fr-career", "parcours", "de-career")],
	});
	assert.deepEqual(
		Object.fromEntries(Object.entries(translations).map(([locale, t]) => [locale, t?.slug])),
		{ de: "daten", en: "data" },
	);
	assert.equal(termTranslations(translations.en!, { de: [source] }).de?.slug, "daten");
});
test("list structured data links every post and the breadcrumb trail", () => {
	const [page, breadcrumb] = blogListJsonLd({
		url: "https://x.test/category/daten",
		name: "Daten — Blog",
		locale: "de",
		siteUrl: "https://x.test",
		breadcrumbs: [
			{ name: "Start", url: "https://x.test/" },
			{ name: "Blog", url: "https://x.test/posts" },
		],
		posts: [{ url: "https://x.test/posts/a", name: "A", datePublished: "2026-01-01" }],
	})["@graph"];
	assert.equal(page["@type"], "CollectionPage");
	assert.ok(!("description" in page));
	assert.ok("mainEntity" in page);
	assert.deepEqual(page.mainEntity.itemListElement[0]!.item, {
		"@type": "BlogPosting",
		"@id": "https://x.test/posts/a",
		url: "https://x.test/posts/a",
		headline: "A",
		datePublished: "2026-01-01",
	});
	assert.equal(breadcrumb.itemListElement?.[1]?.item, "https://x.test/posts");
});
