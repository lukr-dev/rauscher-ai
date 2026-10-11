import assert from "node:assert/strict";
import { test } from "node:test";
import { localizedHref, translationHref, siteUi } from "./i18n.ts";
test("localized navigation keeps internal paths, queries and fragments without altering external links", () => {
	assert.equal(localizedHref("/", "fr"), "/fr/");
	assert.equal(localizedHref("/posts/en/english-post", "en"), "/en/posts/english-post");
	assert.equal(localizedHref("/fr/posts/fr/article", "de"), "/posts/article");
	assert.equal(localizedHref("/en/posts?category=data#top", "fr"), "/fr/posts?category=data#top");
	assert.equal(localizedHref("/fr/about", "de"), "/about");
	assert.equal(localizedHref("/english", "en"), "/en/english");
	for (const link of [
		"#quests",
		"mailto:lukas@rauscher.ai",
		"https://example.com/",
		"//example.com/",
		"/_emdash/admin",
	])
		assert.equal(localizedHref(link, "fr"), link);
});
test("language switching uses published translated slugs and ignores drafts", () => {
	const content = { collection: "posts", slug: "german-post" };
	const translations = [
		{ locale: "de", slug: "german-post", status: "published" },
		{ locale: "en", slug: "english-post", status: "published" },
		{ locale: "fr", slug: "secret-draft", status: "draft" },
	];
	assert.equal(
		translationHref("/posts/german-post", "en", content, translations),
		"/en/posts/english-post",
	);
	assert.equal(
		translationHref("/en/posts/english-post", "fr", content, translations),
		"/fr/posts/german-post",
	);
	assert.equal(
		translationHref(
			"/en/posts/english-post",
			"fr",
			{ collection: "posts", slug: "en/english-post" },
			translations,
		),
		"/fr/posts/german-post",
	);
	assert.equal(
		translationHref(
			"/en/posts/only-english",
			"fr",
			{ collection: "posts", slug: "en/only-english" },
			[{ locale: "en", slug: "only-english", status: "published" }],
		),
		"/fr/posts",
	);
	assert.equal(translationHref("/fr/", "en", { collection: "pages", slug: "home" }), "/en/");
	assert.equal(
		translationHref("/posts", "fr", { collection: "pages", slug: "posts" }),
		"/fr/posts",
	);
	assert.equal(siteUi("fr").about, "À propos");
});
