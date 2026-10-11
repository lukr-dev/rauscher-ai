import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

export function levelUpPlugin(): PluginDescriptor {
	return {
		id: "rauscher-level-up",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-level-up",
		componentsEntry: "@rauscher-ai/emdash-level-up/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "rauscher-level-up",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{
					type: "rauscher-level-up",
					label: "Level Up",
					category: "Rauscher.ai",
					fields: [
						{
							type: "text_input",
							action_id: "heading",
							label: "Heading",
							initial_value: "Level up",
						},
						{
							type: "portable_text",
							action_id: "intro",
							label: "Introduction",
							initial_value: [],
							preview_class: "on-dark copy-lead",
						},
						{
							type: "repeater",
							action_id: "highlights",
							label: "Highlights",
							item_label: "Highlight",
							initial_value: [],
							fields: [
								{ type: "text_input", action_id: "value", label: "Value" },
								{
									type: "text_input",
									action_id: "description",
									label: "Description",
									multiline: true,
								},
							],
						},
						{ type: "text_input", action_id: "buttonLabel", label: "Button label" },
						{ type: "text_input", action_id: "buttonLink", label: "Button link" },
					] as unknown as PortableTextBlockField[],
				},
			],
		},
	});
}

export default createPlugin;
