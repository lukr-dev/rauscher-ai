import { ContentSaveRejectedError, isSafeHref as isSafeLink } from "emdash";
import type { ImageValue, PortableTextBlock } from "emdash";

export { isSafeLink };

export interface HeroCard {
	title: string;
	photo: ImageValue;
	rarity?: string;
	back?: PortableTextBlock[];
	abilityLabel?: string;
	abilityText?: string;
}

export interface HeroNode {
	_type: "rauscher-hero";
	_key: string;
	intro?: PortableTextBlock[];
	cards?: HeroCard[];
	completionMessage?: string;
	completionLinkLabel?: string;
	completionLink?: string;
}

export function validateHeroContent(content: unknown): void {
	if (!Array.isArray(content)) return;
	for (const node of content) {
		if (node?._type !== "rauscher-hero") continue;
		if (!Array.isArray(node.cards)) {
			throw new ContentSaveRejectedError("Hero cards must be a list.");
		}
		for (const [index, card] of node.cards.entries()) {
			if (typeof card?.title !== "string" || !card.title.trim()) {
				throw new ContentSaveRejectedError(`Hero card ${index + 1} needs a role title.`);
			}
			if (
				!card.photo ||
				typeof card.photo !== "object" ||
				!(
					(typeof card.photo.id === "string" && card.photo.id.trim()) ||
					(typeof card.photo.src === "string" && card.photo.src.trim())
				)
			) {
				throw new ContentSaveRejectedError(`Hero card ${index + 1} needs a photo.`);
			}
			if (
				card.photo.src &&
				(!isSafeLink(card.photo.src) || /^(mailto:|tel:|#)/iu.test(card.photo.src.trim()))
			) {
				throw new ContentSaveRejectedError(`Hero card ${index + 1} has an invalid photo URL.`);
			}
		}
		if (
			node.completionLink &&
			(typeof node.completionLink !== "string" || !isSafeLink(node.completionLink))
		) {
			throw new ContentSaveRejectedError(
				"The hero completion link must be a valid web, email, phone or page link.",
			);
		}
	}
}
