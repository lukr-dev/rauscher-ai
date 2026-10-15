import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlunkDeliver, PLUNK_SEND_URL, toHtml } from "./deliver.ts";

const options = { from: { email: "cms@rauscher.ai", name: "rauscher.ai" } };
const log = { info() {} };

function recordingFetch(status = 200, body = "{}") {
	const calls: { url: string; init: RequestInit }[] = [];
	const send = (async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		return new Response(body, { status });
	}) as typeof fetch;
	return { calls, send };
}

test("plunk sends html, sender and reply-to with the secret key", async () => {
	const { calls, send } = recordingFetch();
	const deliver = createPlunkDeliver(
		{ ...options, replyTo: "lukas@rauscher.ai" },
		{ readKey: () => "sk_test", send },
	);
	await deliver(
		{ message: { to: "a@example.com", subject: "Sign in", text: "x", html: "<b>x</b>" } },
		{ log },
	);

	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, PLUNK_SEND_URL);
	assert.equal((calls[0].init.headers as Record<string, string>).authorization, "Bearer sk_test");
	assert.deepEqual(JSON.parse(calls[0].init.body as string), {
		to: "a@example.com",
		from: options.from,
		subject: "Sign in",
		body: "<b>x</b>",
		reply: "lukas@rauscher.ai",
	});
});

test("plunk adds cc recipients and prefers the message reply-to", async () => {
	const { calls, send } = recordingFetch();
	const deliver = createPlunkDeliver(
		{ ...options, replyTo: "default@rauscher.ai" },
		{ readKey: () => "sk", send },
	);
	await deliver(
		{
			message: {
				to: "a@example.com",
				cc: ["b@example.com"],
				replyTo: "own@example.com",
				subject: "s",
				text: "t",
			},
		},
		{ log },
	);

	const body = JSON.parse(calls[0].init.body as string);
	assert.deepEqual(body.to, ["a@example.com", "b@example.com"]);
	assert.equal(body.reply, "own@example.com");
});

test("plunk escapes plain-text messages into html", () => {
	assert.equal(
		toHtml({ to: "a@example.com", subject: "s", text: "Hi <you>\nhttps://x.test/?a=1&b=2" }),
		"<p>Hi &#60;you&#62;<br>https://x.test/?a=1&#38;b=2</p>",
	);
});

test("plunk fails loudly without a key or on API errors", async () => {
	const message = { to: "a@example.com", subject: "s", text: "t" };
	const { send } = recordingFetch(401, '{"error":{"code":"INVALID_API_KEY"}}');
	await assert.rejects(
		createPlunkDeliver(options, { readKey: () => undefined, send })({ message }, { log }),
		/PLUNK_SECRET_KEY/,
	);
	await assert.rejects(
		createPlunkDeliver(options, { readKey: () => "sk", send })({ message }, { log }),
		/401.*INVALID_API_KEY/,
	);
});

test("plunk logs instead of sending when no key is set in dev", async (t) => {
	const { calls, send } = recordingFetch();
	const info = t.mock.method(console, "info", () => {});
	const deliver = createPlunkDeliver(options, { readKey: () => undefined, send, dev: true });
	await deliver(
		{ message: { to: "a@example.com", subject: "Sign in", text: "https://x.test" } },
		{ log },
	);

	assert.equal(calls.length, 0);
	assert.match(String(info.mock.calls[0].arguments[0]), /Sign in[\s\S]*https:\/\/x\.test/);
});
