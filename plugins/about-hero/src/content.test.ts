import assert from "node:assert/strict";
import { test } from "node:test";
import { aboutCardBack } from "./content.ts";

const block = (text: string, style = "normal") => ({
	_type: "block",
	_key: text,
	style,
	children: [{ _type: "span", text }],
});

test("about card uses structured facts and drops empty rows", () => {
	assert.deepEqual(
		aboutCardBack({
			backTitle: " Steckbrief ",
			facts: [
				{ label: "Wohnort", value: "Biel/Bienne" },
				{ label: " ", value: "" },
			],
			back: [block("Ignored", "h2")],
		}),
		{ title: "Steckbrief", facts: [{ label: "Wohnort", value: "Biel/Bienne" }] },
	);
});

test("about card falls back to legacy rich text lines", () => {
	assert.deepEqual(
		aboutCardBack({
			back: [block("Profil", "h2"), block("Domicile : Biel/Bienne"), block("Just text")],
		}),
		{
			title: "Profil",
			facts: [
				{ label: "Domicile", value: "Biel/Bienne" },
				{ label: "", value: "Just text" },
			],
		},
	);
	assert.deepEqual(aboutCardBack({}), { facts: [] });
});
