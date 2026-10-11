import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

// The versioned admin patch supports styled rich text inside block forms.
const fields = [
	{
		type: "text_input",
		action_id: "heading",
		label: "Heading",
		initial_value: "Inventar",
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
		action_id: "tools",
		label: "Tools",
		item_label: "Tool",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Name",
			},
			{
				type: "text_input",
				action_id: "category",
				label: "Category (creates a filter automatically)",
			},
			{
				type: "media_picker",
				action_id: "logo",
				label: "Logo (optional)",
				mime_type_filter: "image/",
			},
		],
	},
] as unknown as PortableTextBlockField[];

export function inventoryPlugin(): PluginDescriptor {
	return {
		id: "rauscher-inventory",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-inventory",
		componentsEntry: "@rauscher-ai/emdash-inventory/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-inventory",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{ type: "rauscher-inventory", label: "Inventar — Tools", category: "Rauscher.ai", fields },
			],
		},
	});
}
export default createPlugin;
