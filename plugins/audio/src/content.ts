export type AudioValue =
	| string
	| {
			src?: string;
			url?: string;
			provider?: string;
			meta?: { storageKey?: unknown };
	  }
	| null
	| undefined;

/** Resolves a media_picker value to a playable URL, preferring the storage's public URL. */
export function audioSource(
	value: AudioValue,
	publicUrl?: (storageKey: string) => string,
): string | undefined {
	if (typeof value === "string") return value.trim() || undefined;
	if (!value) return undefined;
	const storageKey = value.meta?.storageKey;
	if (typeof storageKey === "string" && storageKey && publicUrl) return publicUrl(storageKey);
	return value.src || value.url || undefined;
}

/** Formats seconds as m:ss, or h:mm:ss from one hour; unknown durations read 0:00. */
export function formatTime(seconds: number): string {
	const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const rest = String(total % 60).padStart(2, "0");
	return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

/** Splits a plain-text transcript into paragraphs at blank lines. */
export function transcriptParagraphs(transcript?: string): string[] {
	return (transcript ?? "")
		.split(/\n\s*\n/u)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}

export const playbackRates = [1, 1.25, 1.5, 2, 0.75];

export function nextPlaybackRate(rate: number): number {
	const index = playbackRates.indexOf(rate);
	return playbackRates[(index + 1) % playbackRates.length]!;
}
