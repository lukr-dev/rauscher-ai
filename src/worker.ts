import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";

export { PluginBridge };

export default {
	...handler,
	fetch(request, env, context) {
		const url = new URL(request.url);
		if (url.hostname === "www.rauscher.ai") {
			url.hostname = "rauscher.ai";
			url.protocol = "https:";
			return Response.redirect(url.href, 301);
		}
		return handler.fetch!(request, env, context);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
