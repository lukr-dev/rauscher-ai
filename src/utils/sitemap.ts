export interface SitemapUrl {
	loc: string;
	alternates: { hreflang: string; href: string }[];
}
const escapeXml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
	);
/** Same order EmDash uses for its sitemaps: site setting, environment, request. */
export function publicOrigin(settingsUrl: string | undefined, requestUrl: URL): string {
	const env = typeof process === "undefined" ? undefined : process.env?.EMDASH_SITE_URL;
	return (settingsUrl || env || requestUrl.origin).replace(/\/$/, "");
}
export function urlSetXml(urls: SitemapUrl[]): string {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls.map((url) =>
			[
				"  <url>",
				`    <loc>${escapeXml(url.loc)}</loc>`,
				...url.alternates.map(
					(alternate) =>
						`    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}"/>`,
				),
				"  </url>",
			].join("\n"),
		),
		"</urlset>",
	].join("\n");
}
/** Adds a child sitemap to EmDash's generated sitemap index. */
export function withChildSitemap(indexXml: string, loc: string): string {
	return indexXml.replace(
		"</sitemapindex>",
		`  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>\n</sitemapindex>`,
	);
}
