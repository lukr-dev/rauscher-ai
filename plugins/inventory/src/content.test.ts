import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryKey, inventoryCategories } from "./content.ts";
test("filters follow tool categories, merging whitespace and case", () => {
	assert.deepEqual(
		inventoryCategories([
			{ category: " Daten " },
			{ category: "DATEN" },
			{ category: "KI  & APIs" },
			{ category: "" },
			{},
		]),
		[
			{ key: "daten", label: "Daten" },
			{ key: "ki & apis", label: "KI & APIs" },
		],
	);
	assert.equal(categoryKey(" KI  & APIs "), "ki & apis");
	assert.deepEqual(inventoryCategories([]), []);
	assert.deepEqual(inventoryCategories([{ category: "Bauen" }]), [
		{ key: "bauen", label: "Bauen" },
	]);
	assert.deepEqual(inventoryCategories([{ category: "__proto__" }]), [
		{ key: "__proto__", label: "__proto__" },
	]);
});
