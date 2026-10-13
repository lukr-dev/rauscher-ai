import { readFileSync } from "node:fs";
import { EmDashClient } from "emdash/client";

const baseUrl = process.argv[2];
if (!baseUrl) throw new Error("Usage: node scripts/migrations/002-post-highlights.mjs <site-url>");
const client = new EmDashClient({
	baseUrl,
	token: process.env.EMDASH_TOKEN,
	devBypass: ["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseUrl).hostname),
});
const collection = await client.collection("posts");
const seed = JSON.parse(readFileSync(new URL("../../seed/seed.json", import.meta.url), "utf8"));
const fields = seed.collections
	.find((item) => item.slug === "posts")
	.fields.filter((field) => ["highlight", "top_post"].includes(field.slug));
for (const field of fields) {
	if (collection.fields.some((existing) => existing.slug === field.slug)) {
		console.log(`${field.slug}: already exists`);
		continue;
	}
	await client.createField("posts", field);
	console.log(`${field.slug}: created`);
}
