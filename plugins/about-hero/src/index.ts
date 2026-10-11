import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

// The versioned admin patch supports styled rich text inside block forms.
const fields = [
	{
		type: "text_input",
		action_id: "heading",
		label: "Heading",
		initial_value: "Über mich",
	},
	{
		type: "repeater",
		action_id: "badges",
		label: "Role / location badges",
		item_label: "Badge",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Label",
			},
		],
	},
	{
		type: "portable_text",
		action_id: "intro",
		label: "Introduction",
		initial_value: [],
		preview_class: "on-yellow copy-intro",
	},
	{
		type: "repeater",
		action_id: "links",
		label: "Contact links",
		item_label: "Link",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Label",
			},
			{
				type: "text_input",
				action_id: "url",
				label: "Link",
			},
		],
	},
	{
		type: "media_picker",
		action_id: "photo",
		label: "Photo",
		mime_type_filter: "image/",
	},
	{
		type: "text_input",
		action_id: "cardName",
		label: "Card name",
		initial_value: "Lukas Rauscher",
	},
	{
		type: "portable_text",
		action_id: "back",
		label: "Card back",
		initial_value: [],
		preview_class: "on-dark copy-card",
	},
	{
		type: "text_input",
		action_id: "abilityLabel",
		label: "Special ability label (optional)",
	},
	{
		type: "text_input",
		action_id: "abilityText",
		label: "Special ability text (optional)",
		multiline: true,
	},
] as unknown as PortableTextBlockField[];

export function aboutHeroPlugin(): PluginDescriptor {
	return {
		id: "rauscher-about-hero",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-about-hero",
		componentsEntry: "@rauscher-ai/emdash-about-hero/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-about-hero",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{ type: "rauscher-about-hero", label: "About — Hero", category: "Rauscher.ai", fields },
			],
		},
	});
}
export default createPlugin;
