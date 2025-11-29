import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
	Container,
	Paper,
	TextInput,
	Slider,
	Button,
	Text,
	Group,
	Stack,
	Title,
	CopyButton,
	ActionIcon,
	Tooltip,
	Alert,
} from "@mantine/core";
import { createShortLinkFn } from "../lib/server-functions";
import { getBaseUrl } from "../lib/utils";
import { isValidUrl, normalizeUrl } from "../lib/utils";
import AuthButton from "../components/AuthButton";
import { Check, Copy, X } from "lucide-react";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [url, setUrl] = useState("");
	const [length, setLength] = useState(6);
	const [shortLink, setShortLink] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setError(null);
		setShortLink(null);

		const normalized = normalizeUrl(url);
		if (!isValidUrl(normalized)) {
			setError("Please enter a valid URL");
			return;
		}

		setLoading(true);
		try {
			const result = await createShortLinkFn({
				data: {
					originalUrl: normalized,
					length,
				},
			});

			const baseUrl = getBaseUrl();
			setShortLink(`${baseUrl}/${result.shortId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error creating link");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container size="md" py="xl">
			<Stack gap="lg">
				<Group justify="space-between" align="center">
					<Title order={1}>Cutly</Title>
					<AuthButton />
				</Group>

				<Paper shadow="sm" p="xl" withBorder>
					<Stack gap="md">
						<TextInput
							label="Original URL"
							placeholder="https://example.com"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSubmit();
								}
							}}
							error={error ? undefined : false}
							autoFocus
						/>

						<div style={{ paddingBottom: "16px" }}>
							<Text size="sm" fw={500} mb="xs">
								Short link length: {length} characters
							</Text>
							<Slider
								value={length}
								onChange={setLength}
								min={4}
								max={20}
								marks={[
									{ value: 4, label: "4" },
									{ value: 6, label: "6" },
									{ value: 10, label: "10" },
									{ value: 15, label: "15" },
									{ value: 20, label: "20" },
								]}
							/>
						</div>

						{error && (
							<Alert icon={<X size={16} />} title="Error" color="red">
								{error}
							</Alert>
						)}

						<Button
							onClick={handleSubmit}
							loading={loading}
							disabled={!url.trim()}
							fullWidth
						>
							Create short link
						</Button>

						{shortLink && (
							<Paper p="md" withBorder bg="gray.0">
								<Stack gap="sm">
									<Text size="sm" fw={500}>
										Your short link:
									</Text>
									<Group gap="xs">
										<Text
											component="a"
											href={shortLink}
											target="_blank"
											rel="noopener noreferrer"
											c="blue"
											style={{ flex: 1, wordBreak: "break-all" }}
										>
											{shortLink}
										</Text>
										<CopyButton value={shortLink}>
											{({ copied, copy }) => (
												<Tooltip
													label={copied ? "Copied!" : "Copy"}
													withArrow
													position="right"
												>
													<ActionIcon
														color={copied ? "teal" : "gray"}
														onClick={copy}
														variant="light"
													>
														{copied ? <Check size={16} /> : <Copy size={16} />}
													</ActionIcon>
												</Tooltip>
											)}
										</CopyButton>
									</Group>
								</Stack>
							</Paper>
						)}
					</Stack>
				</Paper>
			</Stack>
		</Container>
	);
}
