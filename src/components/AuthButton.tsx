import { useState, useEffect } from "react";
import { Button } from "@mantine/core";
import { createServerFn, createMiddleware } from "@tanstack/react-start";
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
		const userId = await getAuthSession(context.request);
		return { userId };
	});

const checkOidcConfigured = createServerFn({
	method: "GET",
}).handler(async () => {
	const client = await getClient();
	return { isConfigured: client !== null };
});

export default function AuthButton() {
	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isOidcConfigured, setIsOidcConfigured] = useState(false);

	useEffect(() => {
		Promise.all([
			getSession().then(({ userId }) => {
				setUserId(userId);
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

	if (userId) {
		return (
			<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
				<span style={{ fontSize: "14px", color: "#9ca3af" }}>
					User: {userId}
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
