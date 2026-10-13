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
import type { ContentEntry, TaxonomyTerm } from "emdash";
const post = (
	id: string,
	topPost = false,
	status = "published",
	category = "data",
	tag = "astro",
) =>
	({
		id,
		data: {
			id,
			status,
			top_post: topPost,
			terms: { category: [{ slug: category }], tag: [{ slug: tag }] },
		},
		edit: {},
	}) as unknown as ContentEntry<{
		id: string;
		status: string;
		top_post: boolean;
		terms: { category: { slug: string }[]; tag: { slug: string }[] };
	}>;

test("Top Post replaces newest without duplicating it, including on later pages", () => {
	const posts = [post("new"), post("older", true)];
	const result = featuredPosts(posts, posts[1]);
	assert.equal(result.featured?.id, "older");
	assert.equal(result.topPost, true);
	assert.deepEqual(
		result.rest.map((p) => p.id),
		["new"],
	);
	const laterPage = featuredPosts(posts, posts[1], "next");
	assert.equal(laterPage.featured, undefined);
	assert.equal(laterPage.topPost, false);
	assert.deepEqual(
		laterPage.rest.map((p) => p.id),
		["new"],
	);
	assert.equal(featuredPosts(posts, post("outside-page", true)).featured?.id, "outside-page");
});

test("fallback is newest when no eligible Top Post exists", () => {
	const posts = [post("new"), post("older")];
	for (const topPost of [null, post("unchecked"), post("draft", true, "draft")]) {
		const result = featuredPosts(posts, topPost);
		assert.equal(result.featured?.id, "new");
		assert.equal(result.topPost, false);
		assert.deepEqual(
			result.rest.map((p) => p.id),
			["older"],
		);
	}
	assert.equal(featuredPosts([], null).featured, undefined);
});

test("filtered lists only feature a matching Top Post and otherwise show regular cards", () => {
	const posts = [post("new"), post("older")];
	const otherCategory = featuredPosts(
		posts,
		post("other", true, "published", "career"),
		undefined,
		"data",
	);
	assert.equal(otherCategory.featured, undefined);
	assert.deepEqual(
		otherCategory.rest.map((p) => p.id),
		["new", "older"],
	);
	assert.equal(
		featuredPosts(
			posts,
			post("other", true, "published", "data", "python"),
			undefined,
			undefined,
			"astro",
		).featured,
		undefined,
	);
	assert.equal(featuredPosts(posts, null, undefined, "data").featured, undefined);
	assert.equal(
		featuredPosts(posts, post("matching", true), undefined, "data", "astro").featured?.id,
		"matching",
	);
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
