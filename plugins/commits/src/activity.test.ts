import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchActivity, summarizeActivity } from "./activity.ts";

test("activity totals and longest streak include runs at the end", () => {
	const days = [1, 2, 0, 3, 4, 5].map((count, index) => ({
		date: `2026-01-0${index + 1}`,
		count,
		level: 1,
	}));
	assert.equal(summarizeActivity(days).total, 15);
	assert.equal(summarizeActivity(days).longestStreak, 3);
	assert.equal(summarizeActivity([]).longestStreak, 0);
});

test("invalid usernames do not make a network request", async () => {
	assert.equal(await fetchActivity("../other"), null);
	assert.equal(await fetchActivity(""), null);
});

test("bad upstream data shows unavailable instead of invented activity", async (t) => {
	t.mock.method(globalThis, "fetch", async () =>
		Response.json({ contributions: [{ date: "bad", count: -1 }] }),
	);
	assert.equal(await fetchActivity("lukr-dev"), null);
});
