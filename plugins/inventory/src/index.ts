import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";
import { brandIconSet } from "./icons.ts";

// The versioned admin patch supports styled rich text and icon pickers inside block forms.
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
				type: "icon_picker",
				action_id: "icon",
				label: "Brand icon (optional)",
				icons_route: "icons",
				placeholder: "Search CoreUI brands…",
				empty_hint: "No matching brand? Upload a custom logo below.",
			},
			{
				type: "media_picker",
				action_id: "logo",
				label: "Custom logo (used when no brand icon is selected)",
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
		routes: {
			icons: {
				public: true,
				methods: ["GET"],
				cacheControl: "public, max-age=86400",
				handler: async () => brandIconSet(),
			},
		},
		admin: {
			portableTextBlocks: [
				{ type: "rauscher-inventory", label: "Inventar — Tools", category: "Rauscher.ai", fields },
			],
		},
	});
}
export default createPlugin;
