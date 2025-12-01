import { createFileRoute, redirect } from "@tanstack/react-router";
import { shouldUseSecureCookie } from "../../../lib/auth";

export const Route = createFileRoute("/api/auth/logout")({
	server: {
		handlers: {
			GET: async () => {
				// Remove session cookie
				const secureFlag = shouldUseSecureCookie() ? "; Secure" : "";
				const cookie = `oidc_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;

				return redirect({
					to: "/",
					headers: {
						"Set-Cookie": cookie,
					},
				});
			},
		},
	},
});
