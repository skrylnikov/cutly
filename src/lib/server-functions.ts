import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getAuthSession, isOidcConfigured } from "./auth";
import { createShortLink } from "./shorten";

const requestMiddleware = createMiddleware({ type: "request" }).server(
	async ({ request, next }) => {
		return next({
			context: { request },
		});
	},
);

export const createShortLinkFn = createServerFn({
	method: "POST",
})
	.middleware([requestMiddleware])
	.inputValidator((data: { originalUrl: string; length?: number }) => data)
	.handler(async ({ data, context }) => {
		// If OIDC is configured, require authentication
		if (isOidcConfigured()) {
			const userId = await getAuthSession(context.request);
			if (!userId) {
				throw new Error("Unauthorized: Authentication required");
			}

			try {
				const result = await createShortLink({
					originalUrl: data.originalUrl,
					length: data.length ?? 4,
					userId,
				});

				return result;
			} catch (error) {
				console.error("Error creating short link:", error);
				throw new Error(
					error instanceof Error ? error.message : "Failed to create short link",
				);
			}
		}

		// If OIDC is not configured, allow unauthenticated users
		const userId = await getAuthSession(context.request);

		try {
			const result = await createShortLink({
				originalUrl: data.originalUrl,
				length: data.length ?? 4,
				userId: userId ?? null,
			});

			return result;
		} catch (error) {
			console.error("Error creating short link:", error);
			throw new Error(
				error instanceof Error ? error.message : "Failed to create short link",
			);
		}
	});
