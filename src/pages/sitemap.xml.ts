import type { APIRoute } from "astro";
import { getSiteSettings } from "emdash";
import { GET as emdashSitemapIndex } from "emdash/internal/routes/sitemap.xml";
import { publicOrigin, withChildSitemap } from "../utils/sitemap";

export const prerender = false;

/** EmDash's collection sitemaps plus the category and tag pages. */
export const GET: APIRoute = async (context) => {
	const response = await emdashSitemapIndex(context);
	if (!response.ok) return response;
	const origin = publicOrigin((await getSiteSettings()).url, context.url);
	return new Response(withChildSitemap(await response.text(), `${origin}/sitemap-taxonomies.xml`), {
		status: response.status,
		headers: response.headers,
	});
};
