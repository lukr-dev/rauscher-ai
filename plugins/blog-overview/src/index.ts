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
					] as unknown as PortableTextBlockField[],
				},
			],
		},
	});
}
export default createPlugin;
