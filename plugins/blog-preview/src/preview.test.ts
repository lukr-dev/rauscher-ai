import assert from "node:assert/strict";
import { test } from "node:test";
import { postPreview } from "./preview.ts";

const content = [
	{
		_type: "block",
		_key: "body",
		children: [{ _type: "span", text: "Erster Satz. Zweiter Satz! Dritter Satz?" }],
	},
];
test("preview uses an explicit intro or the first two sentences", () => {
	assert.equal(postPreview(content, "  Custom intro  ").intro, "Custom intro");
	assert.equal(postPreview(content, " ").intro, "Erster Satz. Zweiter Satz!");
	assert.equal(postPreview(undefined).intro, "");
});
test("reading time uses post content", () => {
	assert.equal(postPreview(content).readingMinutes, 1);
	const long = [
		{
			_type: "block",
			_key: "long",
			children: [{ _type: "span", text: Array(401).fill("Wort").join(" ") }],
		},
	];
	assert.equal(postPreview(long, "Short intro").readingMinutes, 3);
});
