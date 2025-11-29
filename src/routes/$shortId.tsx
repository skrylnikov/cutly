import { createFileRoute } from "@tanstack/react-router";
import { getShortLinkByShortId } from "../lib/shorten";
import { prisma } from "../db";

export const Route = createFileRoute("/$shortId")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const { shortId } = params;

				const shortLink = await getShortLinkByShortId(shortId);

				if (!shortLink) {
					return new Response("Short link not found", { status: 404 });
				}

				const ip =
					request.headers.get("x-forwarded-for") ||
					request.headers.get("x-real-ip") ||
					"unknown";
				const userAgent = request.headers.get("user-agent") || "unknown";

				let userId: string | null = null;
				const cookies = request.headers.get("cookie");
				if (cookies) {
					const sessionCookie = cookies
						.split(";")
						.find((c) => c.trim().startsWith("oidc_session="));
					if (sessionCookie) {
						try {
							const sessionValue = decodeURIComponent(
								sessionCookie.split("=")[1],
							);
							const session = JSON.parse(sessionValue);
							userId = session.userId || null;
						} catch {}
					}
				}

				prisma.click
					.create({
						data: {
							shortLinkId: shortLink.id,
							ip,
							userAgent,
							userId,
						},
					})
					.catch((error) => {
						console.error("Error recording click:", error);
					});

				return Response.redirect(shortLink.originalUrl, 302);
			},
		},
	},
});
