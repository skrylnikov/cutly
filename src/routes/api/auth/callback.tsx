import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	createJWT,
	getJwtCookieMaxAge,
	handleCallback,
	shouldUseSecureCookie,
} from "../../../lib/auth";

export const Route = createFileRoute("/api/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				if (!code || !state) {
					return redirect({ to: "/", search: { error: "auth_failed" } });
				}

				// Get codeVerifier from cookies
				const cookies = request.headers.get("cookie") || "";
				const codeVerifierCookie = cookies
					.split(";")
					.find((c) => c.trim().startsWith("oidc_code_verifier="));
				const stateCookie = cookies
					.split(";")
					.find((c) => c.trim().startsWith("oidc_state="));

				if (!codeVerifierCookie || !stateCookie) {
					return redirect({ to: "/", search: { error: "auth_failed" } });
				}

				const codeVerifier = decodeURIComponent(
					codeVerifierCookie.split("=")[1],
				);
				const savedState = decodeURIComponent(stateCookie.split("=")[1]);

				// Check state
				if (state !== savedState) {
					return redirect({ to: "/", search: { error: "auth_failed" } });
				}

				try {
					const currentUrl = new URL(request.url);
					const { userId, displayName } = await handleCallback(
						currentUrl,
						codeVerifier,
						savedState,
					);

					// Create JWT token and session cookie, remove temporary cookies
					const jwtToken = await createJWT(userId, displayName);
					const maxAge = getJwtCookieMaxAge();
					const secureFlag = shouldUseSecureCookie() ? "; Secure" : "";
					const sessionCookie = `oidc_session=${encodeURIComponent(jwtToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;
					const clearCookies = [
						sessionCookie,
						`oidc_code_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
						`oidc_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
					];

					const headers = new Headers();
					clearCookies.forEach((cookie) => {
						headers.append("Set-Cookie", cookie);
					});

					return redirect({
						to: "/",
						headers,
					});
				} catch (error) {
					console.error("Callback error:", error);
					return redirect({ to: "/", search: { error: "auth_failed" } });
				}
			},
		},
	},
});
