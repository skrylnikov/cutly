import * as jose from "jose";
import type { Configuration } from "openid-client";
import * as client from "openid-client";
import { z } from "zod";

let config: Configuration | null = null;
let encodedJwtSecret: Uint8Array | null = null;

/**
 * JWT token expiration time
 * This value is used for both JWT expiration and cookie Max-Age
 */
const JWT_EXPIRATION_TIME = "24h";

/**
 * Get cookie Max-Age in seconds based on JWT expiration time
 * Converts time strings like "24h", "7d" to seconds
 */
export function getJwtCookieMaxAge(): number {
	const timeStr = JWT_EXPIRATION_TIME.toLowerCase();

	if (timeStr.endsWith("h")) {
		const hours = parseInt(timeStr.slice(0, -1), 10);
		if (isNaN(hours) || hours <= 0) {
			console.warn(`[auth] Invalid JWT_EXPIRATION_TIME value: "${JWT_EXPIRATION_TIME}". Falling back to default (24h).`);
			return 24 * 60 * 60;
		}
		return hours * 60 * 60;
	}
	if (timeStr.endsWith("d")) {
		const days = parseInt(timeStr.slice(0, -1), 10);
		if (isNaN(days) || days <= 0) {
			console.warn(`[auth] Invalid JWT_EXPIRATION_TIME value: "${JWT_EXPIRATION_TIME}". Falling back to default (24h).`);
			return 24 * 60 * 60;
		}
		return days * 24 * 60 * 60;
	}
	if (timeStr.endsWith("m")) {
		const minutes = parseInt(timeStr.slice(0, -1), 10);
		if (isNaN(minutes) || minutes <= 0) {
			console.warn(`[auth] Invalid JWT_EXPIRATION_TIME value: "${JWT_EXPIRATION_TIME}". Falling back to default (24h).`);
			return 24 * 60 * 60;
		}
		return minutes * 60;
	}
	if (timeStr.endsWith("s")) {
		const seconds = parseInt(timeStr.slice(0, -1), 10);
		if (isNaN(seconds) || seconds <= 0) {
			console.warn(`[auth] Invalid JWT_EXPIRATION_TIME value: "${JWT_EXPIRATION_TIME}". Falling back to default (24h).`);
			return 24 * 60 * 60;
		}
		return seconds;
	}

	// Default fallback: 24 hours
	console.warn(`[auth] Invalid JWT_EXPIRATION_TIME value: "${JWT_EXPIRATION_TIME}". Falling back to default (24h).`);
	return 24 * 60 * 60;
}

/**
 * Check if Secure flag should be used for cookies
 * Returns true if APP_URL uses HTTPS protocol
 */
export function shouldUseSecureCookie(): boolean {
	const appUrl = process.env.APP_URL;
	if (!appUrl) {
		// Default to false for local development
		return false;
	}

	try {
		const url = new URL(appUrl);
		return url.protocol === "https:";
	} catch {
		// If APP_URL is invalid, default to false
		return false;
	}
}

/**
 * Zod schema for JWT payload validation
 */
const jwtPayloadSchema = z.object({
	userId: z.string().min(1),
	displayName: z.string().optional(),
});

/**
 * Get encoded JWT secret, encoding it once and caching the result
 */
function getEncodedJwtSecret(): Uint8Array {
	if (encodedJwtSecret) {
		return encodedJwtSecret;
	}

	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("JWT_SECRET is not configured");
	}

	encodedJwtSecret = new TextEncoder().encode(jwtSecret);
	return encodedJwtSecret;
}

/**
 * Initialize OIDC client
 */
export async function getClient(): Promise<Configuration | null> {
	if (config) {
		return config;
	}

	const issuerUrl = process.env.OIDC_ISSUER;
	const clientId = process.env.OIDC_CLIENT_ID;
	const clientSecret = process.env.OIDC_CLIENT_SECRET;

	if (!issuerUrl || !clientId || !clientSecret) {
		return null;
	}

	try {
		config = await client.discovery(new URL(issuerUrl), clientId, clientSecret);
		return config;
	} catch (error) {
		console.error("Failed to initialize OIDC client:", error);
		return null;
	}
}

/**
 * Create JWT token for user session
 */
export async function createJWT(
	userId: string,
	displayName: string,
): Promise<string> {
	const secret = getEncodedJwtSecret();
	const token = await new jose.SignJWT({ userId, displayName })
		.setProtectedHeader({ alg: "HS512" })
		.setExpirationTime(JWT_EXPIRATION_TIME)
		.sign(secret);

	return token;
}

/**
 * Get current user session from cookies
 */
export async function getAuthSession(
	request?: Request,
): Promise<{ userId: string; displayName: string } | null> {
	if (request) {
		const cookies = request.headers.get("cookie");
		if (cookies) {
			const sessionCookie = cookies
				.split(";")
				.find((c) => c.trim().startsWith("oidc_session="));
			if (sessionCookie) {
				try {
					const jwtToken = decodeURIComponent(sessionCookie.split("=")[1]);
					const secret = getEncodedJwtSecret();
					const { payload } = await jose.jwtVerify(jwtToken, secret, {
						algorithms: ["HS512"],
					});

					// Validate payload structure with zod
					const validatedPayload = jwtPayloadSchema.parse(payload);

					return {
						userId: validatedPayload.userId,
						displayName:
							validatedPayload.displayName || validatedPayload.userId,
					};
				} catch {
					return null;
				}
			}
		}
	}

	return null;
}

/**
 * Create URL for OIDC authorization
 */
export async function getAuthUrl(
	redirectUri: string,
): Promise<{ url: string; cookies: string[] }> {
	const oidcConfig = await getClient();
	if (!oidcConfig) {
		throw new Error("OIDC client not configured");
	}

	const codeVerifier = client.randomPKCECodeVerifier();
	const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
	const state = client.randomState();

	const parameters: Record<string, string> = {
		redirect_uri: redirectUri,
		scope: "openid profile email",
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		state,
	};

	const authUrl = client.buildAuthorizationUrl(oidcConfig, parameters);

	const cookies = [
		`oidc_code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
		`oidc_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
	];

	return { url: authUrl.href, cookies };
}

/**
 * Handle OIDC callback
 */
export async function handleCallback(
	currentUrl: URL,
	codeVerifier: string,
	expectedState: string,
): Promise<{ userId: string; displayName: string; accessToken: string }> {
	const oidcConfig = await getClient();
	if (!oidcConfig) {
		throw new Error("OIDC client not configured");
	}

	const tokenSet = await client.authorizationCodeGrant(oidcConfig, currentUrl, {
		pkceCodeVerifier: codeVerifier,
		expectedState,
	});

	const idToken = tokenSet.claims();
	if (!idToken) {
		throw new Error("ID token not found in response");
	}
	const userId = idToken.sub as string;

	// Extract display name with fallback priority: name > preferred_username > email > sub
	const displayName =
		(idToken.display_name as string | undefined) ||
		(idToken.name as string | undefined) ||
		(idToken.preferred_username as string | undefined) ||
		(idToken.email as string | undefined) ||
		userId;

	const accessToken = tokenSet.access_token;
	if (!accessToken) {
		throw new Error("Access token not found in response");
	}

	return {
		userId,
		displayName,
		accessToken,
	};
}

/**
 * Check if OIDC is configured
 */
export function isOidcConfigured(): boolean {
	return !!(
		process.env.OIDC_ISSUER &&
		process.env.OIDC_CLIENT_ID &&
		process.env.OIDC_CLIENT_SECRET &&
		process.env.JWT_SECRET
	);
}

/**
 * Check authorization (middleware)
 */
export async function requireAuth(
	request?: Request,
): Promise<{ userId: string; displayName: string }> {
	const session = await getAuthSession(request);
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}
