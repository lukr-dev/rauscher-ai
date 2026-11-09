import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const component = readFileSync(
	new URL("../components/AnalyticsConsent.astro", import.meta.url),
	"utf8",
);
const script = component.match(/<script is:inline>([\s\S]*?)<\/script>/)![1];
const storageKey = "rauscher-analytics-consent-v1";
const disableKey = "ga-disable-G-Q3H6FGBQCN";

function setup({
	stored = null as string | null,
	hostname = "rauscher.ai",
	protocol = "https:",
	storageBlocked = false,
} = {}) {
	const elements = Object.fromEntries(
		["cookie-banner", "cookie-settings", "cookie-accept", "cookie-reject"].map((id) => [
			id,
			{
				hidden: true,
				focused: false,
				click: () => {},
				focus() {
					this.focused = true;
				},
				addEventListener(_event: string, callback: () => void) {
					this.click = callback;
				},
			},
		]),
	);
	const scripts: { src: string; async: boolean }[] = [];
	const deletedCookies: string[] = [];
	const storage = new Map(stored === null ? [] : [[storageKey, stored]]);
	const listeners: Record<string, (event: { key: string | null }) => void> = {};
	let reloads = 0;
	const window: Record<string, unknown> = {
		addEventListener(event: string, listener: (event: { key: string | null }) => void) {
			listeners[event] = listener;
		},
	};
	runInNewContext(script, {
		window,
		location: { hostname, protocol, reload: () => reloads++ },
		localStorage: {
			getItem(key: string) {
				if (storageBlocked) throw new Error("blocked");
				return storage.get(key) ?? null;
			},
			setItem(key: string, value: string) {
				if (storageBlocked) throw new Error("blocked");
				storage.set(key, value);
			},
		},
		document: {
			getElementById: (id: string) => elements[id],
			createElement: () => ({}),
			head: { appendChild: (tag: (typeof scripts)[number]) => scripts.push(tag) },
			set cookie(value: string) {
				deletedCookies.push(value);
			},
		},
	});
	return { elements, scripts, storage, window, listeners, deletedCookies, reloads: () => reloads };
}
const saved = (choice: string, expires = Date.now() + 60_000) =>
	JSON.stringify({ choice, expires });

test("no Google script or queue exists before consent or after rejection", () => {
	const page = setup();
	assert.equal(page.elements["cookie-banner"].hidden, false);
	assert.equal(page.scripts.length, 0);
	assert.equal(page.window.dataLayer, undefined);
	assert.equal(page.window[disableKey], true);
	page.elements["cookie-reject"].click();
	assert.equal(page.elements["cookie-banner"].hidden, true);
	assert.equal(page.scripts.length, 0);
	const choice = JSON.parse(page.storage.get(storageKey)!);
	assert.equal(choice.choice, "rejected");
	assert.ok(choice.expires > Date.now());
	assert.equal(setup({ stored: saved("rejected") }).scripts.length, 0);
});

test("acceptance loads the requested property once with advertising denied", () => {
	const page = setup();
	page.elements["cookie-accept"].click();
	page.elements["cookie-accept"].click();
	assert.equal(page.scripts.length, 1);
	assert.equal(page.scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-Q3H6FGBQCN");
	assert.equal(page.scripts[0].async, true);
	assert.equal(page.window[disableKey], false);
	const queue = page.window.dataLayer as IArguments[];
	assert.equal(queue[0][0], "consent");
	assert.equal(queue[0][2].analytics_storage, "granted");
	for (const type of ["ad_storage", "ad_user_data", "ad_personalization"])
		assert.equal(queue[0][2][type], "denied");
	assert.equal(queue[2][1], "G-Q3H6FGBQCN");
	assert.equal(JSON.parse(page.storage.get(storageKey)!).choice, "accepted");
	assert.equal(setup({ stored: page.storage.get(storageKey)! }).scripts.length, 1);
});

test("settings allow withdrawing consent, disabling GA and deleting its cookies before reload", () => {
	const page = setup({ stored: saved("accepted") });
	page.elements["cookie-settings"].click();
	assert.equal(page.elements["cookie-banner"].hidden, false);
	assert.equal(page.elements["cookie-reject"].focused, true);
	page.elements["cookie-reject"].click();
	assert.equal(page.window[disableKey], true);
	assert.equal(page.reloads(), 1);
	assert.ok(page.deletedCookies.some((value) => value.startsWith("_ga_Q3H6FGBQCN=; Max-Age=0;")));
	assert.ok(page.deletedCookies.some((value) => value.includes("Domain=rauscher.ai;")));
	assert.equal(setup({ stored: page.storage.get(storageKey)! }).scripts.length, 0);
});

test("missing, corrupt, invalid and expired choices fail closed", () => {
	for (const stored of [
		null,
		"broken",
		"null",
		saved("other"),
		saved("accepted", Date.now() - 1),
		saved("accepted", Date.now() + 999999999999),
	]) {
		const page = setup({ stored });
		assert.equal(page.scripts.length, 0);
		assert.equal(page.elements["cookie-banner"].hidden, false);
	}
	const page = setup({ storageBlocked: true });
	assert.equal(page.scripts.length, 0);
	page.elements["cookie-accept"].click();
	assert.equal(page.scripts.length, 1);
	page.elements["cookie-reject"].click();
	assert.equal(page.window[disableKey], true);
});

test("consent removal in another tab disables an active tag", () => {
	for (const key of [storageKey, null]) {
		const page = setup({ stored: saved("accepted") });
		page.storage.clear();
		page.listeners.storage({ key });
		assert.equal(page.window[disableKey], true);
		assert.equal(page.reloads(), 1);
	}
});

test("non-production hosts and HTTP cannot load analytics even with saved consent", () => {
	for (const hostname of [
		"localhost",
		"127.0.0.1",
		"preview.workers.dev",
		"rauscher.ai.example.com",
	]) {
		const page = setup({ hostname, stored: saved("accepted") });
		page.elements["cookie-accept"].click();
		assert.equal(page.scripts.length, 0);
		assert.equal(page.elements["cookie-settings"].hidden, true);
	}
	assert.equal(setup({ protocol: "http:", stored: saved("accepted") }).scripts.length, 0);
	assert.equal(setup({ hostname: "www.rauscher.ai", stored: saved("accepted") }).scripts.length, 1);
});
