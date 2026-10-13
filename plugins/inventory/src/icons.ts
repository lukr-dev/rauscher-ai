import { icons } from "@iconify-json/cib";

// CoreUI Brands (CC0) in Iconify format, the set browsed at icones.js.org/collection/cib.
export interface BrandIcon {
	body: string;
	width: number;
	height: number;
}
export function brandIcon(name?: string): BrandIcon | undefined {
	const key = name?.trim() ?? "";
	const alias = Object.hasOwn(icons.aliases ?? {}, key) ? icons.aliases![key]!.parent : key;
	if (!Object.hasOwn(icons.icons, alias)) return;
	const icon = icons.icons[alias]!;
	return {
		body: icon.body,
		width: icon.width ?? icons.width ?? 16,
		height: icon.height ?? icons.height ?? 16,
	};
}
// Payload for the admin icon picker: every icon name mapped to its SVG body.
export function brandIconSet(): {
	width: number;
	height: number;
	icons: Record<string, string>;
} {
	return {
		width: icons.width ?? 16,
		height: icons.height ?? 16,
		icons: Object.fromEntries(Object.entries(icons.icons).map(([name, icon]) => [name, icon.body])),
	};
}
