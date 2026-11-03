import { definePlugin } from "emdash";
import type { PluginDescriptor, PortableTextBlockField } from "emdash";

// The versioned admin patch stores media_picker values as media objects and previews audio.
const fields = [
	{
		type: "media_picker",
		action_id: "audio",
		label: "Audio file (MP3, WAV or Ogg)",
		placeholder: "Select audio",
		mime_type_filter: "audio/",
		required: true,
	},
	{
		type: "text_input",
		action_id: "title",
		label: "Title (optional)",
	},
	{
		type: "text_input",
		action_id: "caption",
		label: "Caption (optional)",
		multiline: true,
	},
	{
		type: "text_input",
		action_id: "transcript",
		label: "Transcript (optional, blank lines separate paragraphs)",
		multiline: true,
	},
] as unknown as PortableTextBlockField[];

export function audioPlugin(): PluginDescriptor {
	return {
		id: "rauscher-audio",
		version: "1.0.0",
		format: "native",
		entrypoint: "@rauscher-ai/emdash-audio",
		componentsEntry: "@rauscher-ai/emdash-audio/astro",
	};
}
export function createPlugin() {
	return definePlugin({
		id: "rauscher-audio",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [
				{
					type: "rauscher-audio",
					label: "Audio",
					description: "Audio player for MP3, WAV or Ogg files",
					category: "Rauscher.ai",
					fields,
				},
			],
		},
	});
}
export default createPlugin;
