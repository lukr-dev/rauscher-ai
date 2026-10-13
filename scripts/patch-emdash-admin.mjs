import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const root = new URL("../", import.meta.url);
const entry = new URL("node_modules/@emdash-cms/admin/dist/index.js", root);
const { version } = JSON.parse(
	readFileSync(new URL("node_modules/@emdash-cms/admin/package.json", root), "utf8"),
);
assert.equal(version, "1.2.0", "Review the nested-rich-text patch before upgrading EmDash admin.");
const installed = readFileSync(entry, "utf8");
if (!installed.includes("// Rauscher: searchable icon picker")) {
	assert.ok(
		!installed.includes("// Rauscher: optional status fields"),
		"An older admin patch is applied. Reinstall @emdash-cms/admin (rm -rf node_modules/@emdash-cms/admin && npm install).",
	);
	execFileSync("git", ["apply", "--check", "patches/emdash-admin-1.2.0.patch"], { cwd: root });
	execFileSync("git", ["apply", "patches/emdash-admin-1.2.0.patch"], { cwd: root });
}

const source = readFileSync(entry, "utf8");
assert.ok(source.includes("const hasFields = Array.isArray(blockDef?.fields);"));
const start = source.indexOf("function hasRequiredPluginFields(");
assert.ok(start >= 0);
const end = source.indexOf("function PluginBlockModal(", start);
const validate = runInNewContext(`${source.slice(start, end)}; hasRequiredPluginFields`);
const fields = [
	{
		type: "repeater",
		action_id: "cards",
		fields: [
			{ type: "text_input", action_id: "title", required: true },
			{ type: "media_picker", action_id: "photo", required: true },
		],
	},
];
assert.equal(validate(fields, { cards: [{ title: "", photo: { id: "photo" } }] }), false);
assert.equal(validate(fields, { cards: [{ title: "Role", photo: null }] }), false);
assert.equal(
	validate(fields, { cards: [{ title: "Role", photo: { src: "/media/photo.jpg" } }] }),
	true,
);
assert.equal(validate(fields, { cards: [] }), true);
assert.equal(validate([], {}), true);
assert.ok(source.includes('href: "/styles/rich-text.css"'));
const initStart = source.indexOf("for (const sf of field.fields) switch (sf.type)");
const initEnd = source.indexOf("\n\t\tsetExpanded", initStart);
const initialize = runInNewContext(
	`(fields) => { const field = {fields}; const newItem = {}; ${source.slice(initStart, initEnd)}; return newItem; }`,
);
const nested = initialize([
	{ type: "repeater", action_id: "skills" },
	{ type: "portable_text", action_id: "intro" },
]);
assert.ok(Array.isArray(nested.skills));
assert.ok(Array.isArray(nested.intro));
assert.ok(source.includes("previewClass && `rauscher-rich-text ${previewClass}`"));
assert.ok(source.includes('...(!field.required ? [{ value: "", label: "None" }] : [])'));
assert.ok(source.includes('handleChange(!field.required && !v ? null : v ?? "")'));
const selectStart = source.indexOf("// Rauscher: optional status fields");
const selectChange = source
	.slice(selectStart)
	.match(/onValueChange: (\(v\) => handleChange[^\n]+)/)[1];
for (const [required, value, expected] of [
	[false, "", null],
	[false, "In Arbeit", "In Arbeit"],
	[true, "", ""],
]) {
	let saved;
	runInNewContext(`(${selectChange.slice(0, -1)})`, {
		field: { required },
		handleChange: (value) => {
			saved = value;
		},
	})(value);
	assert.equal(saved, expected);
}
assert.ok(source.includes('case "icon_picker": return jsx(BlockKitIconPicker'));
const searchStart = source.indexOf("function searchBlockKitIcons(");
const searchIcons = runInNewContext(
	`${source.slice(searchStart, source.indexOf("function BlockKitIconSvg(", searchStart))}; searchBlockKitIcons`,
);
const names = ["github-actions", "git", "github", "gitlab", "docker"];
assert.deepEqual([...searchIcons(names, "git")], ["git", "github", "github-actions", "gitlab"]);
assert.deepEqual([...searchIcons(names, "hub act")], ["github-actions"]);
assert.deepEqual([...searchIcons(names, "")], [...names].sort());
console.log("EmDash rich-text and icon-picker patch applied and verified.");
