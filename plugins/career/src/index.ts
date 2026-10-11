import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

// The versioned admin patch supports styled rich text inside block forms.
const fields = [
	{
		type: "text_input",
		action_id: "heading",
		label: "Heading",
		initial_value: "Laufbahn",
	},
	{
		type: "portable_text",
		action_id: "intro",
		label: "Introduction",
		initial_value: [],
		preview_class: "on-yellow copy-lead",
	},
	{
		type: "repeater",
		action_id: "entries",
		label: "Career entries (display order)",
		item_label: "Entry",
		initial_value: [],
		fields: [
			{
				type: "text_input",
				action_id: "title",
				label: "Role / qualification",
			},
			{
				type: "text_input",
				action_id: "organisation",
				label: "Organisation",
			},
			{
				type: "text_input",
				action_id: "dateRange",
				label: "Date range",
			},
			{
				type: "select",
				action_id: "kind",
				label: "Type",
				options: [
					{
						label: "Job",
						value: "job",
					},
					{
						label: "Ausbildung",
						value: "education",
					},
				],
			},
			{
				type: "toggle",
				action_id: "current",
				label: "Current",
			},
			{
				type: "repeater",
				action_id: "points",
				label: "Bullet points",
				item_label: "Point",
				initial_value: [],
				fields: [
					{
						type: "text_input",
						action_id: "text",
						label: "Text",
						multiline: true,
					},
				],
			},
		],
	},
] as unknown as PortableTextBlockField[];

export function careerPlugin(): PluginDescriptor {
	return {
		id: "rauscher-career",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-career",
		componentsEntry: "@rauscher-ai/emdash-career/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-career",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{ type: "rauscher-career", label: "Laufbahn — Career", category: "Rauscher.ai", fields },
			],
		},
	});
}
export default createPlugin;
