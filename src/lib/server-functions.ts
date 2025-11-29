import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { createShortLink } from "./shorten";
import { getAuthSession } from "./auth";

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
		const userId = await getAuthSession(context.request);

		try {
			const result = await createShortLink({
				originalUrl: data.originalUrl,
				length: data.length ?? 6,
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
