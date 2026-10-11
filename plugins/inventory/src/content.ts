export function categoryKey(category?: string): string {
	return (category ?? "").trim().replace(/\s+/gu, " ").toLocaleLowerCase("de");
}
export function inventoryCategories(
	tools: { category?: string }[],
): { key: string; label: string }[] {
	const categories = new Map<string, string>();
	for (const tool of tools) {
		const key = categoryKey(tool.category);
		if (key && !categories.has(key))
			categories.set(key, tool.category!.trim().replace(/\s+/gu, " "));
	}
	return [...categories].map(([key, label]) => ({ key, label }));
}
