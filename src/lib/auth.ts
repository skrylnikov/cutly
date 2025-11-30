import type { Configuration } from "openid-client";
import * as client from "openid-client";

let config: Configuration | null = null;

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
					const sessionValue = decodeURIComponent(sessionCookie.split("=")[1]);
					const session = JSON.parse(sessionValue);
					if (session.userId) {
						return {
							userId: session.userId,
							displayName: session.displayName || session.userId,
						};
					}
					return null;
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
		process.env.OIDC_CLIENT_SECRET
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
