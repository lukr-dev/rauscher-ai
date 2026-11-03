import assert from "node:assert/strict";
import { test } from "node:test";
import { audioSource, formatTime, nextPlaybackRate, transcriptParagraphs } from "./content.ts";
test("audio source prefers the public storage URL, then the stored URL", () => {
	const value = {
		src: "/_emdash/api/media/file/01J.mp3",
		provider: "local",
		meta: { storageKey: "01J.mp3" },
	};
	assert.equal(
		audioSource(value, (key) => `https://media.example/${key}`),
		"https://media.example/01J.mp3",
	);
	assert.equal(audioSource(value), "/_emdash/api/media/file/01J.mp3");
	assert.equal(audioSource({ url: "https://cdn.example/a.mp3" }), "https://cdn.example/a.mp3");
	assert.equal(audioSource(" /media/a.mp3 "), "/media/a.mp3");
	assert.equal(audioSource(""), undefined);
	assert.equal(audioSource(null), undefined);
	assert.equal(audioSource({ meta: {} }), undefined);
});
test("times read as m:ss below an hour and h:mm:ss above", () => {
	assert.equal(formatTime(0), "0:00");
	assert.equal(formatTime(9.9), "0:09");
	assert.equal(formatTime(75), "1:15");
	assert.equal(formatTime(3725), "1:02:05");
	assert.equal(formatTime(Number.NaN), "0:00");
	assert.equal(formatTime(Number.POSITIVE_INFINITY), "0:00");
	assert.equal(formatTime(-4), "0:00");
});
test("transcripts split into paragraphs at blank lines", () => {
	assert.deepEqual(transcriptParagraphs("Hallo.\nZweite Zeile.\n\n  \nNeuer Absatz. "), [
		"Hallo.\nZweite Zeile.",
		"Neuer Absatz.",
	]);
	assert.deepEqual(transcriptParagraphs(""), []);
	assert.deepEqual(transcriptParagraphs(undefined), []);
});
test("playback speed cycles and restarts from unknown rates", () => {
	assert.equal(nextPlaybackRate(1), 1.25);
	assert.equal(nextPlaybackRate(2), 0.75);
	assert.equal(nextPlaybackRate(0.75), 1);
	assert.equal(nextPlaybackRate(3), 1);
});
