import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

export function blogOverviewPlugin(): PluginDescriptor {
	return {
		id: "rauscher-blog-overview",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-blog-overview",
		componentsEntry: "@rauscher-ai/emdash-blog-overview/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-blog-overview",
		version: "1.0.0",
		capabilities: ["content:read"],
		routes: {
			posts: {
				permission: "content:read",
				handler: async (ctx) => {
					const items: { id: string; name: string }[] = [];
					let cursor: string | undefined;
					do {
						const result = await ctx.content!.list("posts", {
							limit: 100,
							cursor,
							where: { status: "published" },
						});
						items.push(
							...result.items.map((post) => ({
								id: post.id,
								name: String(post.data.title ?? post.slug),
							})),
						);
						cursor = result.hasMore ? result.cursor : undefined;
					} while (cursor);
					return { items };
				},
			},
		},
		admin: {
			portableTextBlocks: [
				{
					type: "rauscher-blog-overview",
					label: "Blog Overview",
					category: "Rauscher.ai",
					fields: [
						{ type: "text_input", action_id: "heading", label: "Heading", initial_value: "Blog" },
						{
							type: "portable_text",
							action_id: "intro",
							label: "Introduction",
							initial_value: [],
							preview_class: "on-yellow copy-intro",
						},
						{
							type: "select",
							action_id: "highlightPost",
							label: "Highlighted post (optional; otherwise newest)",
							options: [],
							optionsRoute: "posts",
						},
					] as unknown as PortableTextBlockField[],
				},
			],
		},
	});
}
export default createPlugin;
