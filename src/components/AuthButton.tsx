import { Button } from "@mantine/core";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAuthSession, getClient } from "../lib/auth";

const requestMiddleware = createMiddleware({ type: "request" }).server(
	async ({ request, next }) => {
		return next({
			context: { request },
		});
	},
);

const getSession = createServerFn({
	method: "GET",
})
	.middleware([requestMiddleware])
	.handler(async ({ context }) => {
		const session = await getAuthSession(context.request);
		return session ? { userId: session.userId, displayName: session.displayName } : null;
	});

const checkOidcConfigured = createServerFn({
	method: "GET",
}).handler(async () => {
	const client = await getClient();
	return { isConfigured: client !== null };
});

export default function AuthButton() {
	const [session, setSession] = useState<{ userId: string; displayName: string } | null>(null);
	const [loading, setLoading] = useState(true);
	const [isOidcConfigured, setIsOidcConfigured] = useState(false);

	useEffect(() => {
		Promise.all([
			getSession().then((result) => {
				setSession(result);
			}),
			checkOidcConfigured().then(({ isConfigured }) => {
				setIsOidcConfigured(isConfigured);
			}),
		])
			.catch(() => {
				// Ignore errors
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	// If OIDC is not configured, don't show button
	if (!isOidcConfigured) {
		return null;
	}

	if (loading) {
		return (
			<Button variant="light" loading>
				Loading...
			</Button>
		);
	}

	if (session) {
		return (
			<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
				<span style={{ fontSize: "14px", color: "#9ca3af" }}>
					User: {session.displayName}
				</span>
				<Button
					variant="light"
					onClick={() => {
						window.location.href = "/api/auth/logout";
					}}
				>
					Logout
				</Button>
			</div>
		);
	}

	return (
		<Button
			variant="light"
			onClick={() => {
				window.location.href = "/api/auth/login";
			}}
		>
			Login
		</Button>
	);
}
