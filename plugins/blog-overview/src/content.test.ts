import assert from "node:assert/strict";
import { test } from "node:test";
import { featuredPosts, flattenTerms } from "./content.ts";
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

test("Top Post respects both category and tag filters", () => {
	const posts = [post("new")];
	assert.equal(
		featuredPosts(posts, post("other", true, "published", "career"), undefined, "data").featured
			?.id,
		"new",
	);
	assert.equal(
		featuredPosts(
			posts,
			post("other", true, "published", "data", "python"),
			undefined,
			"data",
			"astro",
		).featured?.id,
		"new",
	);
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
