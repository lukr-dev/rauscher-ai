import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export function blogPreviewPlugin(): PluginDescriptor {
	return {
		id: "rauscher-blog-preview",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-blog-preview",
		componentsEntry: "@rauscher-ai/emdash-blog-preview/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "rauscher-blog-preview",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{
					type: "rauscher-blog-preview",
					label: "Blog preview — Latest three posts",
					category: "Rauscher.ai",
					fields: [],
				},
			],
		},
	});
}

export default createPlugin;
