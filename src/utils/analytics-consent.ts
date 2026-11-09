import { createConsentStore, defineScript, gateScript } from "@policystack/core/consent";
import { localStorageAdapter } from "@policystack/core/consent/storage/local-storage";

const measurementId = "G-Q3H6FGBQCN";
const storageKey = "rauscher-policystack-consent-v1";
const lifetime = 180 * 24 * 60 * 60 * 1000;

export function initAnalyticsConsent() {
	const banner = document.getElementById("cookie-banner");
	const settings = document.getElementById("cookie-settings");
	const accept = document.getElementById("cookie-accept");
	const reject = document.getElementById("cookie-reject");
	if (
		!banner ||
		!settings ||
		!accept ||
		!reject ||
		location.protocol !== "https:" ||
		!["rauscher.ai", "www.rauscher.ai"].includes(location.hostname)
	)
		return;

	const analytics = window as typeof window & {
		dataLayer: IArguments[];
		gtag: (...args: unknown[]) => void;
		"ga-disable-G-Q3H6FGBQCN": boolean;
	};
	// No jurisdiction resolver: require explicit opt-in for every visitor.
	const store = createConsentStore({
		categories: [
			{ key: "essential", label: "Essential", locked: true },
			{ key: "analytics", label: "Google Analytics" },
		],
		locale: document.documentElement.lang,
		adapter: localStorageAdapter({ key: storageKey }),
		triggers: { expiresAfter: lifetime },
		canWithdraw: true,
	});
	let started = false;

	function clearAnalyticsCookies() {
		for (const name of ["_ga", "_ga_Q3H6FGBQCN"]) {
			for (const domain of ["", location.hostname, "rauscher.ai"]) {
				document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} Secure; SameSite=Lax`;
			}
		}
	}

	function render() {
		const granted = store.has("analytics");
		analytics[`ga-disable-${measurementId}`] = !granted;
		banner!.hidden = store.getState().route === "closed";
		if (!granted) {
			clearAnalyticsCookies();
			// PolicyStack persists after notifying subscribers; reload only after that write.
			if (started) queueMicrotask(() => location.reload());
		}
	}
	store.subscribe(render);
	render();
	gateScript(
		store,
		defineScript({
			id: "ga4",
			requires: "analytics",
			src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
			init: () => {
				started = true;
				analytics.dataLayer = analytics.dataLayer || [];
				analytics.gtag = function () {
					analytics.dataLayer.push(arguments);
				};
				analytics.gtag("consent", "default", {
					analytics_storage: "granted",
					ad_storage: "denied",
					ad_user_data: "denied",
					ad_personalization: "denied",
				});
				analytics.gtag("js", new Date());
				analytics.gtag("config", measurementId, {
					allow_google_signals: false,
					allow_ad_personalization_signals: false,
					cookie_expires: lifetime / 1000,
					// Keep the landing URL intact so GA4 reads its native UTM campaign fields.
					page_location: location.href,
				});
				trackEngagement();
			},
		}),
	);

	function trackEngagement() {
		function send(name: string, parameters: Record<string, string | number>) {
			if (store.has("analytics") && !analytics[`ga-disable-${measurementId}`])
				analytics.gtag("event", name, { ...parameters, send_to: measurementId });
		}
		document.addEventListener("click", (event) => {
			if (!(event.target instanceof Element)) return;
			const link = event.target.closest<HTMLAnchorElement>("a[href]");
			if (!link) return;
			const url = new URL(link.href, location.href);
			if (url.protocol === "mailto:") {
				send("contact_click", {
					contact_method: "email",
					link_location: link.closest("footer") ? "footer" : "content",
				});
			} else if (
				url.origin === location.origin &&
				/^\/(?:en\/|fr\/)?posts\/[^/]+\/?$/.test(url.pathname)
			) {
				send("select_content", { content_type: "article", item_id: url.pathname });
			}
		});
		const startedAudio = new WeakSet<Element>();
		const completedAudio = new WeakSet<Element>();
		for (const [event, name, seen] of [
			["play", "audio_start", startedAudio],
			["ended", "audio_complete", completedAudio],
		] as const) {
			document.addEventListener(
				event,
				(event) => {
					const audio = event.target;
					if (!(audio instanceof Element) || !audio.matches("audio[data-audio]") || seen.has(audio))
						return;
					if (!store.has("analytics") || analytics[`ga-disable-${measurementId}`]) return;
					seen.add(audio);
					send(name, {
						audio_index:
							Array.from(document.querySelectorAll("audio[data-audio]")).indexOf(audio) + 1,
					});
				},
				true,
			);
		}
	}

	settings.hidden = false;
	settings.addEventListener("click", () => {
		store.setRoute("cookie");
		reject.focus();
	});
	accept.addEventListener("click", () => {
		store.acceptAll();
		settings.focus();
	});
	reject.addEventListener("click", () => {
		store.acceptNecessary();
		settings.focus();
	});
	// PolicyStack syncs records across tabs but ignores record removal.
	window.addEventListener("storage", (event) => {
		if ((event.key === storageKey || event.key === null) && event.newValue === null) {
			analytics[`ga-disable-${measurementId}`] = true;
			clearAnalyticsCookies();
			location.reload();
		}
	});
}
