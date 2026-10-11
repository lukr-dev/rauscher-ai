import type { PortableTextBlock } from "emdash";

export interface AboutFact {
	label: string;
	value: string;
}

export interface AboutCardBack {
	title?: string;
	facts: AboutFact[];
}

interface CardBackSource {
	backTitle?: string;
	facts?: Partial<AboutFact>[];
	back?: PortableTextBlock[];
}

const blockText = (block: PortableTextBlock) =>
	((block.children ?? []) as { text?: string }[])
		.map((child) => child.text ?? "")
		.join("")
		.trim();

// Older content stored the card back as rich text ("Label: Value" lines under a heading).
export function aboutCardBack(node: CardBackSource): AboutCardBack {
	const facts = (node.facts ?? [])
		.map((fact) => ({ label: fact.label?.trim() ?? "", value: fact.value?.trim() ?? "" }))
		.filter((fact) => fact.label || fact.value);
	if (node.backTitle?.trim() || facts.length > 0) {
		return { title: node.backTitle?.trim() || undefined, facts };
	}
	const legacy: AboutCardBack = { facts: [] };
	for (const block of node.back ?? []) {
		if (block._type !== "block") continue;
		const text = blockText(block);
		if (!text) continue;
		if (/^h\d$/u.test(String(block.style)) && !legacy.title) {
			legacy.title = text;
			continue;
		}
		const separator = text.indexOf(":");
		legacy.facts.push(
			separator > 0
				? { label: text.slice(0, separator).trim(), value: text.slice(separator + 1).trim() }
				: { label: "", value: text },
		);
	}
	return legacy;
}
