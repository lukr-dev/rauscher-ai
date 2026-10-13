import assert from "node:assert/strict";
import { test } from "node:test";
import { brandIcon, brandIconSet } from "./icons.ts";
import { createPlugin } from "./index.ts";

test("brand icons resolve by CoreUI name, including aliases", () => {
	const github = brandIcon(" github ");
	assert.equal(github?.width, 32);
	assert.equal(github?.height, 32);
	assert.match(github!.body, /^<path fill="currentColor" d="/);
	assert.equal(brandIcon("stack-overflow")?.body, brandIcon("stackoverflow")?.body);
	assert.equal(brandIcon(""), undefined);
	assert.equal(brandIcon(undefined), undefined);
	assert.equal(brandIcon("not-a-brand"), undefined);
	assert.equal(brandIcon("__proto__"), undefined);
	assert.equal(brandIcon("toString"), undefined);
});

test("the picker route serves the whole set as name → SVG body", async () => {
	const route = createPlugin().routes!.icons;
	const set = (await route.handler({} as never)) as ReturnType<typeof brandIconSet>;
	assert.equal(route.public, true);
	assert.deepEqual(route.methods, ["GET"]);
	assert.ok(Object.keys(set.icons).length > 800);
	assert.equal(set.icons.docker, brandIcon("docker")!.body);
	assert.deepEqual([set.width, set.height], [32, 32]);
});
