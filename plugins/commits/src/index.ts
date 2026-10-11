import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export function commitsPlugin(): PluginDescriptor {
	return {
		id: "rauscher-commits",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-commits",
		componentsEntry: "@rauscher-ai/emdash-commits/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "rauscher-commits",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{
					type: "rauscher-commits",
					label: "Commits",
					category: "Rauscher.ai",
					fields: [
						{
							type: "text_input",
							action_id: "username",
							label: "GitHub username",
							initial_value: "lukr-dev",
						},
						{
							type: "text_input",
							action_id: "heading",
							label: "Heading",
							initial_value: "Commits",
						},
						{ type: "text_input", action_id: "description", label: "Description", multiline: true },
					],
				},
			],
		},
	});
}

export default createPlugin;
