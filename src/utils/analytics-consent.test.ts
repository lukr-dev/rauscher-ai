import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { initAnalyticsConsent } from "./analytics-consent.ts";

const storageKey = "rauscher-policystack-consent-v1";
class TestElement {
	href = "";
	footer = false;
	audio = false;
	closest(selector: string) {
		return selector === "a[href]" ? (this.href ? this : null) : this.footer ? this : null;
	}
	matches() {
		return this.audio;
	}
}
const configuredTests = new WeakSet<TestContext>();
const disableKey = "ga-disable-G-Q3H6FGBQCN";

function setup(
	t: TestContext,
	{
		stored = null as string | null,
		hostname = "rauscher.ai",
		protocol = "https:",
		storageBlocked = false,
		markup = true,
		query = "",
	} = {},
) {
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
	const listeners: ((event: { key: string | null; newValue: string | null }) => void)[] = [];
	let reloads = 0;
	const documentListeners: Record<string, (event: { target: TestElement }) => void> = {};
	const audio = new TestElement();
	audio.audio = true;
	const url = new URL(`${protocol}//${hostname}/en/posts/example${query}`);
	const window: Record<string, unknown> = {
		addEventListener(
			event: string,
			listener: (event: { key: string | null; newValue: string | null }) => void,
		) {
			if (event === "storage") listeners.push(listener);
		},
	};
	const globals = {
		Element: TestElement,
		window,
		location: { hostname, protocol, href: url.href, origin: url.origin, reload: () => reloads++ },
		localStorage: {
			getItem(key: string) {
				if (storageBlocked) throw new Error("blocked");
				return storage.get(key) ?? null;
			},
			removeItem(key: string) {
				if (storageBlocked) throw new Error("blocked");
				storage.delete(key);
			},
			setItem(key: string, value: string) {
				if (storageBlocked) throw new Error("blocked");
				storage.set(key, value);
			},
		},
		document: {
			getElementById: (id: string) => (markup ? elements[id] : null),
			addEventListener(event: string, handler: (event: { target: TestElement }) => void) {
				documentListeners[event] = handler;
			},
			querySelectorAll: () => [audio],
			createElement: () => ({ addEventListener() {} }),
			documentElement: { lang: "en" },
			head: { appendChild: (tag: (typeof scripts)[number]) => scripts.push(tag) },
			set cookie(value: string) {
				deletedCookies.push(value);
			},
		},
	};
	for (const [key, value] of Object.entries(globals)) {
		const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, value });
		if (!configuredTests.has(t))
			t.after(() => {
				if (descriptor) Object.defineProperty(globalThis, key, descriptor);
				else Reflect.deleteProperty(globalThis, key);
			});
	}
	configuredTests.add(t);
	initAnalyticsConsent();
	return {
		elements,
		scripts,
		storage,
		window,
		listeners,
		documentListeners,
		audio,
		deletedCookies,
		reloads: () => reloads,
	};
}
const saved = (choice: string, decidedAt = Date.now()) =>
	JSON.stringify({
		schemaVersion: 1,
		decisions: { essential: true, analytics: choice === "accepted" },
		decidedAt: new Date(decidedAt).toISOString(),
		policyVersion: "",
		jurisdiction: null,
		locale: "en",
		source: "banner",
	});

test("no Google script or queue exists before consent or after rejection", (t) => {
	const page = setup(t);
	assert.equal(page.elements["cookie-banner"].hidden, false);
	assert.equal(page.scripts.length, 0);
	assert.equal(Object.hasOwn(page.window, "dataLayer"), false);
	assert.equal(page.window[disableKey], true);
	page.elements["cookie-reject"].click();
	assert.equal(page.elements["cookie-banner"].hidden, true);
	assert.equal(page.scripts.length, 0);
	const choice = JSON.parse(page.storage.get(storageKey)!);
	assert.equal(choice.decisions.analytics, false);
	assert.ok(Date.parse(choice.decidedAt) <= Date.now());
	assert.equal(setup(t, { stored: saved("rejected") }).scripts.length, 0);
});

test("acceptance loads the requested property once with advertising denied", (t) => {
	const page = setup(t);
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
	assert.equal(JSON.parse(page.storage.get(storageKey)!).decisions.analytics, true);
	assert.equal(setup(t, { stored: page.storage.get(storageKey)! }).scripts.length, 1);
});

test("settings allow withdrawing consent, disabling GA and deleting its cookies before reload", async (t) => {
	const page = setup(t, { stored: saved("accepted") });
	page.elements["cookie-settings"].click();
	assert.equal(page.elements["cookie-banner"].hidden, false);
	assert.equal(page.elements["cookie-reject"].focused, true);
	page.elements["cookie-reject"].click();
	assert.equal(JSON.parse(page.storage.get(storageKey)!).decisions.analytics, false);
	await Promise.resolve();
	assert.equal(page.window[disableKey], true);
	assert.equal(page.reloads(), 1);
	assert.ok(page.deletedCookies.some((value) => value.startsWith("_ga_Q3H6FGBQCN=; Max-Age=0;")));
	assert.ok(page.deletedCookies.some((value) => value.includes("Domain=rauscher.ai;")));
	assert.equal(setup(t, { stored: page.storage.get(storageKey)! }).scripts.length, 0);
});

test("missing, corrupt, invalid and expired choices fail closed", async (t) => {
	for (const stored of [
		null,
		"broken",
		"null",
		JSON.stringify({ decisions: { analytics: "true" } }),
		saved("accepted", Date.now() - 181 * 24 * 60 * 60 * 1000),
	]) {
		const page = setup(t, { stored });
		assert.equal(page.scripts.length, 0);
		assert.equal(page.elements["cookie-banner"].hidden, false);
	}
	const page = setup(t, { storageBlocked: true });
	assert.equal(page.scripts.length, 0);
	page.elements["cookie-accept"].click();
	assert.equal(page.scripts.length, 1);
	page.elements["cookie-reject"].click();
	await Promise.resolve();
	assert.equal(page.window[disableKey], true);
});

test("consent removal in another tab disables an active tag", (t) => {
	for (const key of [storageKey, null]) {
		const page = setup(t, { stored: saved("accepted") });
		page.storage.clear();
		for (const listener of page.listeners) listener({ key, newValue: null });
		assert.equal(page.window[disableKey], true);
		assert.equal(page.reloads(), 1);
	}
});

test("non-production hosts and HTTP cannot load analytics even with saved consent", (t) => {
	for (const hostname of [
		"localhost",
		"127.0.0.1",
		"preview.workers.dev",
		"rauscher.ai.example.com",
	]) {
		const page = setup(t, { hostname, stored: saved("accepted") });
		page.elements["cookie-accept"].click();
		assert.equal(page.scripts.length, 0);
		assert.equal(page.elements["cookie-settings"].hidden, true);
	}
	assert.equal(setup(t, { protocol: "http:", stored: saved("accepted") }).scripts.length, 0);
	assert.equal(
		setup(t, { hostname: "www.rauscher.ai", stored: saved("accepted") }).scripts.length,
		1,
	);
});

test("PolicyStack propagates rejection records from another tab", async (t) => {
	const page = setup(t, { stored: saved("accepted") });
	const rejected = saved("rejected");
	page.storage.set(storageKey, rejected);
	for (const listener of page.listeners) listener({ key: storageKey, newValue: rejected });
	await Promise.resolve();
	assert.equal(page.window[disableKey], true);
	assert.equal(page.reloads(), 1);
});

test("bundled code is inert when the production-only banner markup is absent", (t) => {
	const page = setup(t, { markup: false, stored: saved("accepted") });
	assert.equal(page.scripts.length, 0);
	assert.equal(page.listeners.length, 0);
});

test("landing UTMs reach GA4 configuration unchanged, only after consent", (t) => {
	const query =
		"?utm_source=newsletter&utm_medium=email&utm_campaign=launch&utm_id=123&utm_term=astro&utm_content=hero";
	const page = setup(t, { query });
	assert.equal(Object.hasOwn(page.window, "dataLayer"), false);
	assert.equal(Object.keys(page.documentListeners).length, 0);
	page.elements["cookie-accept"].click();
	const queue = page.window.dataLayer as IArguments[];
	assert.equal(queue[2][2].page_location, `https://rauscher.ai/en/posts/example${query}`);
	assert.equal(queue.filter((call) => call[0] === "config").length, 1);
});

test("contact, article and audio events respect consent and exclude email addresses and query strings", async (t) => {
	const page = setup(t);
	page.elements["cookie-accept"].click();
	const link = new TestElement();
	link.href = "mailto:lukas@rauscher.ai?subject=private";
	link.footer = true;
	page.documentListeners.click({ target: link });
	link.href = "https://rauscher.ai/fr/posts/article?private=value#heading";
	page.documentListeners.click({ target: link });
	link.href = "https://example.com/posts/article";
	page.documentListeners.click({ target: link });
	for (let repeat = 0; repeat < 2; repeat++) {
		page.documentListeners.play({ target: page.audio });
		page.documentListeners.ended({ target: page.audio });
	}
	const queue = page.window.dataLayer as IArguments[];
	const events = queue.filter((call) => call[0] === "event");
	assert.deepEqual(
		events.map((call) => call[1]),
		["contact_click", "select_content", "audio_start", "audio_complete"],
	);
	assert.equal(events[0][2].contact_method, "email");
	assert.equal(events[0][2].link_location, "footer");
	assert.equal(events[1][2].item_id, "/fr/posts/article");
	assert.equal(events[2][2].audio_index, 1);
	assert.ok(!JSON.stringify(events).includes("private"));
	assert.ok(!JSON.stringify(events).includes("lukas@"));
	page.elements["cookie-reject"].click();
	link.href = "mailto:lukas@rauscher.ai";
	page.documentListeners.click({ target: link });
	assert.equal(queue.filter((call) => call[0] === "event").length, 4);
	await Promise.resolve();
});
