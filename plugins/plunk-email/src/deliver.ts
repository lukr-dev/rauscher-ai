export const PLUNK_SEND_URL = "https://next-api.useplunk.com/v1/send";

export interface PlunkEmailOptions {
	from: { email: string; name?: string };
	replyTo?: string;
}

export interface EmailMessage {
	to: string;
	cc?: string[];
	replyTo?: string;
	subject: string;
	text: string;
	html?: string;
}

interface Logger {
	info(message: string, data?: Record<string, unknown>): void;
}

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Plunk only accepts an HTML body and derives the plain-text part from it.
export const toHtml = (message: EmailMessage) =>
	message.html ?? `<p>${escapeHtml(message.text).replace(/\r?\n/g, "<br>")}</p>`;

interface Deps {
	readKey?: () => string | undefined;
	send?: typeof fetch;
	dev?: boolean;
}

export function createPlunkDeliver(
	options: PlunkEmailOptions,
	{
		readKey = () => process.env.PLUNK_SECRET_KEY,
		send = fetch,
		dev = import.meta.env?.DEV ?? false,
	}: Deps = {},
) {
	return async (event: { message: EmailMessage }, ctx: { log: Logger }) => {
		const { message } = event;
		const key = readKey();
		if (!key && dev) {
			// Mirrors EmDash's dev console provider, which this plugin replaces locally.
			console.info(`[plunk-email] PLUNK_SECRET_KEY not set; not sending to ${message.to}:
Subject: ${message.subject}

${message.text}`);
			return;
		}
		if (!key) throw new Error("[plunk-email] PLUNK_SECRET_KEY is not set");

		const replyTo = message.replyTo ?? options.replyTo;
		// Plunk has no cc field; each address in `to` receives its own copy.
		const to = message.cc?.length ? [message.to, ...message.cc] : message.to;
		const response = await send(PLUNK_SEND_URL, {
			method: "POST",
			headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
			body: JSON.stringify({
				to,
				from: options.from,
				subject: message.subject,
				body: toHtml(message),
				...(replyTo ? { reply: replyTo } : {}),
			}),
		});
		if (!response.ok) {
			const detail = await response.text().catch(() => "");
			throw new Error(`[plunk-email] Plunk responded ${response.status}: ${detail.slice(0, 500)}`);
		}
		ctx.log.info("email delivered via Plunk", { to: message.to, subject: message.subject });
	};
}
