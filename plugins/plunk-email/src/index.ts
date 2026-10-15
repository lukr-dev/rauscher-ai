import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";
import { createPlunkDeliver, type PlunkEmailOptions } from "./deliver.ts";

const id = "rauscher-plunk-email";
const version = "1.0.0";

// Sends EmDash mail (magic links, invites, recovery) through Plunk.
// The secret key is read at send time from the PLUNK_SECRET_KEY Worker secret.
export function plunkEmailPlugin(options: PlunkEmailOptions): PluginDescriptor {
	return {
		id,
		version,
		format: "native",
		entrypoint: "@rauscher-ai/emdash-plunk-email",
		options,
		capabilities: ["hooks.email-transport:register"],
	};
}

export function createPlugin(options: PlunkEmailOptions) {
	return definePlugin({
		id,
		version,
		capabilities: ["hooks.email-transport:register"],
		hooks: {
			"email:deliver": { exclusive: true, handler: createPlunkDeliver(options) },
		},
	});
}

export default createPlugin;
