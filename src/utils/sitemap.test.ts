import assert from "node:assert/strict";
import { test } from "node:test";
import { publicOrigin, urlSetXml, withChildSitemap } from "./sitemap.ts";
test("sitemap URLs escape values and list hreflang alternates", () => {
	const xml = urlSetXml([
		{
			loc: "https://x.test/tag/a&b",
			alternates: [{ hreflang: "en", href: "https://x.test/en/tag/a&b" }],
		},
	]);
	assert.match(xml, /<loc>https:\/\/x\.test\/tag\/a&amp;b<\/loc>/);
	assert.match(xml, /hreflang="en" href="https:\/\/x\.test\/en\/tag\/a&amp;b"/);
});
test("the taxonomy sitemap is appended to the generated index", () => {
	const index = '<sitemapindex xmlns="x">\n  <sitemap><loc>a</loc></sitemap>\n</sitemapindex>';
	const xml = withChildSitemap(index, "https://x.test/sitemap-taxonomies.xml");
	assert.ok(xml.indexOf("<loc>a</loc>") < xml.indexOf("sitemap-taxonomies.xml"));
	assert.ok(xml.trimEnd().endsWith("</sitemapindex>"));
});
test("the public origin prefers the site setting over the request", () => {
	const previous = process.env.EMDASH_SITE_URL;
	delete process.env.EMDASH_SITE_URL;
	assert.equal(
		publicOrigin("https://site.test/", new URL("http://127.0.0.1/x")),
		"https://site.test",
	);
	assert.equal(publicOrigin(undefined, new URL("http://127.0.0.1/x")), "http://127.0.0.1");
	process.env.EMDASH_SITE_URL = "https://env.test";
	assert.equal(publicOrigin(undefined, new URL("http://127.0.0.1/x")), "https://env.test");
	if (previous === undefined) delete process.env.EMDASH_SITE_URL;
	else process.env.EMDASH_SITE_URL = previous;
});
