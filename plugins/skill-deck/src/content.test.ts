import assert from "node:assert/strict";
import { test } from "node:test";
import { skillLevel } from "./content.ts";
test("optional six-segment skill levels remain bounded", () => {
	assert.equal(skillLevel(undefined), undefined);
	assert.equal(skillLevel(NaN), undefined);
	assert.equal(skillLevel("4"), undefined);
	assert.equal(skillLevel(0), 0);
	assert.equal(skillLevel(-2), 0);
	assert.equal(skillLevel(9), 6);
	assert.equal(skillLevel(3.8), 4);
});
