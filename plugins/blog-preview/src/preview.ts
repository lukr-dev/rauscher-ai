import { extractPlainText } from "emdash";
import type { PortableTextBlock } from "emdash";

export function postPreview(content: PortableTextBlock[] | undefined, excerpt?: string) {
	const plain = extractPlainText(content).trim();
	const sentences = [...new Intl.Segmenter("de", { granularity: "sentence" }).segment(plain)];
	return {
		intro:
			excerpt?.trim() ||
			sentences
				.slice(0, 2)
				.map((sentence) => sentence.segment)
				.join("")
				.trim(),
		readingMinutes: Math.max(1, Math.ceil(plain.split(/\s+/u).filter(Boolean).length / 200)),
	};
}
