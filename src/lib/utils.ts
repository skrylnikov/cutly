/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
	try {
		const urlObj = new URL(url);
		return urlObj.protocol === "http:" || urlObj.protocol === "https:";
	} catch {
		return false;
	}
}

/**
 * Normalize URL (add protocol if missing)
 */
export function normalizeUrl(url: string): string {
	const trimmed = url.trim();
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}
	return `https://${trimmed}`;
}

/**
 * Get base URL for short links
 */
export function getBaseUrl(): string {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	// On server use environment variable or default value
	const appUrl = process.env.APP_URL || "http://localhost:3000";
	// Normalize URL to ensure it has a protocol
	return normalizeUrl(appUrl);
}

/**
 * Calculate possible number of URLs for given length
 * nanoid uses 64-character alphabet (A-Z, a-z, 0-9, _, -)
 */
export function calculatePossibleUrls(length: number): number {
	return 64 ** length;
}

/**
 * Format large numbers for readability with commas and suffixes
 */
export function formatLargeNumber(num: number): string {
	// Add commas as thousand separators
	const addCommas = (n: number): string => {
		return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	if (num < 1000) {
		return addCommas(num);
	}
	if (num < 1000000) {
		return `${addCommas(Math.floor(num / 1000))}K`;
	}
	if (num < 1000000000) {
		return `${addCommas(Math.floor(num / 1000000))}M`;
	}
	if (num < 1000000000000) {
		return `${addCommas(Math.floor(num / 1000000000))}B`;
	}
	if (num < 1000000000000000) {
		return `${addCommas(Math.floor(num / 1000000000000))}T`;
	}
	// For extremely large numbers, use T suffix with full number
	return `${addCommas(num)}T`;
}
