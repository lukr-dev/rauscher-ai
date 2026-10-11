export interface Contribution {
	date: string;
	count: number;
	level: number;
}

export function summarizeActivity(days: Contribution[]) {
	let total = 0;
	let streak = 0;
	let longestStreak = 0;
	for (const day of days) {
		total += day.count;
		streak = day.count > 0 ? streak + 1 : 0;
		longestStreak = Math.max(longestStreak, streak);
	}
	return { days, total, longestStreak };
}

export async function fetchActivity(username: string) {
	if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/iu.test(username)) return null;
	try {
		// shortcut: the design's public GitHub proxy avoids a token; replace if it becomes unreliable.
		const response = await fetch(
			`https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
			{
				signal: AbortSignal.timeout(5000),
				cf: { cacheTtl: 3600, cacheEverything: true },
			},
		);
		if (!response.ok) return null;
		const data = (await response.json()) as { contributions?: Contribution[] };
		if (
			!Array.isArray(data.contributions) ||
			!data.contributions.length ||
			!data.contributions.every(
				(day) =>
					/^\d{4}-\d{2}-\d{2}$/u.test(day.date) &&
					Number.isFinite(Date.parse(day.date)) &&
					Number.isInteger(day.count) &&
					day.count >= 0 &&
					Number.isInteger(day.level) &&
					day.level >= 0 &&
					day.level <= 4,
			)
		)
			return null;
		return summarizeActivity(data.contributions.sort((a, b) => a.date.localeCompare(b.date)));
	} catch {
		return null;
	}
}
