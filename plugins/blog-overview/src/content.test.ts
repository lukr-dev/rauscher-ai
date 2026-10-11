import assert from "node:assert/strict";
import { test } from "node:test";
import { featuredPosts, flattenTerms } from "./content.ts";
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
	assert.equal(
		featuredPosts(posts, post("other", "published", "career"), undefined, "data").featured?.id,
		"new",
	);
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
