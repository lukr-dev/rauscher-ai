import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

// The versioned admin patch supports styled rich text inside block forms.
const fields = [
	{
		type: "text_input",
		action_id: "heading",
		label: "Heading",
		initial_value: "Skill-Deck",
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
		action_id: "groups",
		label: "Skill groups",
		item_label: "Group",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Group name",
			},
			{
				type: "repeater",
				action_id: "skills",
				label: "Skills",
				item_label: "Skill",
				initial_value: [],
				fields: [
					{
						type: "text_input",
						action_id: "title",
						label: "Skill name",
					},
					{
						type: "text_input",
						action_id: "proficiency",
						label: "Proficiency text (optional)",
					},
					{
						type: "number_input",
						action_id: "level",
						label: "Level 0–6 (optional)",
						min: 0,
						max: 6,
					},
				],
			},
		],
	},
] as unknown as PortableTextBlockField[];

export function skillDeckPlugin(): PluginDescriptor {
	return {
		id: "rauscher-skill-deck",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-skill-deck",
		componentsEntry: "@rauscher-ai/emdash-skill-deck/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-skill-deck",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{ type: "rauscher-skill-deck", label: "Skill Deck", category: "Rauscher.ai", fields },
			],
		},
	});
}
export default createPlugin;
