import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";
import { validateHeroContent } from "./content.ts";

const id = "rauscher-hero";
const version = "1.0.0";

// The versioned admin patch adds nested rich text and required-field checks.
const fields = [
	{
		type: "portable_text",
		action_id: "intro",
		label: "Introduction",
		initial_value: [],
		preview_class: "on-yellow copy-intro",
	},
	{
		type: "repeater",
		action_id: "cards",
		label: "Flipping cards",
		item_label: "Card",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Role title *",
				required: true,
			},
			{
				type: "media_picker",
				action_id: "photo",
				label: "Photo *",
				mime_type_filter: "image/",
				required: true,
			},
			{ type: "text_input", action_id: "rarity", label: "Rarity (optional)" },
			{
				type: "portable_text",
				action_id: "back",
				label: "Back-side text",
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
		],
	},
	{
		type: "text_input",
		action_id: "completionMessage",
		label: "Completion message",
		initial_value: "Komplett! Jetzt kennst du alle Karten.",
	},
	{
		type: "text_input",
		action_id: "completionLinkLabel",
		label: "Completion link label",
		initial_value: "Den echten treffen",
	},
	{
		type: "text_input",
		action_id: "completionLink",
		label: "Completion link",
		initial_value: "mailto:lukas@rauscher.ai",
	},
] as unknown as PortableTextBlockField[];

export function heroPlugin(): PluginDescriptor {
	return {
		id,
		version,
		format: "native",
		entrypoint: "@rauscher-ai/emdash-hero",
		componentsEntry: "@rauscher-ai/emdash-hero/astro",
	};
}

export function createPlugin() {
	return definePlugin({
		id,
		version,
		capabilities: ["content:write"],
		admin: {
			portableTextBlocks: [
				{
					type: id,
					label: "Hero — Flipping cards",
					category: "Rauscher.ai",
					description: "Lukas introduction with an editable set of flipping cards",
					fields,
				},
			],
		},
		hooks: {
			"content:beforeSave": {
				errorPolicy: "abort",
				handler: async (event) => {
					validateHeroContent(event.content.content);
				},
			},
		},
	});
}

export default createPlugin;
