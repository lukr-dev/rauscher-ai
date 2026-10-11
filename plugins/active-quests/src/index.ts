import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export function activeQuestsPlugin(): PluginDescriptor {
	return {
		id: "rauscher-active-quests",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-active-quests",
		componentsEntry: "@rauscher-ai/emdash-active-quests/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "rauscher-active-quests",
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
								id: post.slug!,
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
					type: "rauscher-active-quests",
					label: "Active Quests",
					category: "Rauscher.ai",
					fields: [
						{
							type: "repeater",
							action_id: "quests",
							label: "Quests",
							item_label: "Quest",
							initial_value: [],
							fields: [
								{ type: "text_input", action_id: "title", label: "Title" },
								{ type: "text_input", action_id: "category", label: "Type / category" },
								{
									type: "text_input",
									action_id: "description",
									label: "Description",
									multiline: true,
								},
								{
									type: "select",
									action_id: "status",
									label: "Status",
									options: [
										{ label: "Läuft", value: "running" },
										{ label: "In Arbeit", value: "in-progress" },
										{ label: "Pausiert", value: "paused" },
									],
								},
								{ type: "text_input", action_id: "since", label: "Since" },
								{ type: "text_input", action_id: "link", label: "External link (optional)" },
								{
									type: "text_input",
									action_id: "linkLabel",
									label: "External link label (optional)",
								},
								{
									type: "select",
									action_id: "relatedPost",
									label: "Related blog post (optional)",
									options: [],
									optionsRoute: "posts",
								},
							],
						},
					],
				},
			],
		},
	});
}

export default createPlugin;
