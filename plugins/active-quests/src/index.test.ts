import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlugin } from "./index.ts";

test("related post picker includes all published pages and uses post slugs", async () => {
	const handler = createPlugin().routes!.posts.handler;
	const calls: unknown[] = [];
	const context = {
		content: {
			list: async (collection: string, options: { cursor?: string }) => {
				calls.push({ collection, ...options });
				return options.cursor
					? { items: [{ slug: "second", data: { title: "Second post" } }], hasMore: false }
					: {
							items: [{ slug: "first", data: { title: "First post" } }],
							hasMore: true,
							cursor: "next",
						};
			},
		},
	} as unknown as Parameters<typeof handler>[0];
	assert.deepEqual(await handler(context), {
		items: [
			{ id: "first", name: "First post" },
			{ id: "second", name: "Second post" },
		],
	});
	assert.deepEqual(calls, [
		{ collection: "posts", limit: 100, cursor: undefined, where: { status: "published" } },
		{ collection: "posts", limit: 100, cursor: "next", where: { status: "published" } },
	]);
});
