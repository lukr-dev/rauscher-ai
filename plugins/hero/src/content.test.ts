import assert from "node:assert/strict";
import { test } from "node:test";
import { isSafeLink, validateHeroContent } from "./content.ts";

const card = { title: "Der Projektleiter", photo: { id: "", src: "/media/hero/p05.jpg" } };

test("hero accepts variable card counts and absent optional fields", () => {
	for (const count of [0, 1, 3, 5, 8]) {
		assert.doesNotThrow(() =>
			validateHeroContent([
				{ _type: "rauscher-hero", cards: Array.from({ length: count }, () => card) },
			]),
		);
	}
});

test("hero requires titles and photos without blocking other blocks", () => {
	assert.doesNotThrow(() => validateHeroContent([{ _type: "block" }]));
	for (const invalid of [
		{ ...card, title: " " },
		{ ...card, photo: null },
		{ ...card, photo: { id: 42 } },
		{ ...card, photo: { src: " " } },
	]) {
		assert.throws(() => validateHeroContent([{ _type: "rauscher-hero", cards: [invalid] }]));
	}
});

test("hero rejects unsafe completion and photo URLs", () => {
	for (const url of [
		"javascript:alert(1)",
		"//evil.example",
		"/\\evil.example",
		"data:text/html,test",
		"java\nscript:alert(1)",
	]) {
		assert.equal(isSafeLink(url), false);
		assert.throws(() =>
			validateHeroContent([{ _type: "rauscher-hero", cards: [card], completionLink: url }]),
		);
	}
	for (const url of ["/about", "#contact", "https://rauscher.ai", "mailto:lukas@rauscher.ai"]) {
		assert.equal(isSafeLink(url), true);
	}
	assert.throws(() =>
		validateHeroContent([
			{ _type: "rauscher-hero", cards: [{ ...card, photo: { src: "javascript:alert(1)" } }] },
		]),
	);
	assert.throws(() =>
		validateHeroContent([
			{ _type: "rauscher-hero", cards: [{ ...card, photo: { src: "MAILTO:lukas@rauscher.ai" } }] },
		]),
	);
});
