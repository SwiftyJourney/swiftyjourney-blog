import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const args = process.argv.slice(2);
const getArg = (name) => {
	const idx = args.indexOf(`--${name}`);
	return idx >= 0 ? args[idx + 1] : undefined;
};

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugify = (value) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const parseDateInput = (value) => {
	if (!value) return new Date();
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return new Date(NaN);
	const [, y, m, d] = match;
	return new Date(Number(y), Number(m) - 1, Number(d));
};

const formatIsoDate = (value) => {
	const yyyy = String(value.getFullYear());
	const mm = String(value.getMonth() + 1).padStart(2, "0");
	const dd = String(value.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

const promptIfMissing = async () => {
	const rl = createInterface({ input, output });
	try {
		const title = (getArg("title") ?? (await rl.question("Title: "))).trim();
		if (!title) {
			console.error("Title is required.");
			process.exit(1);
		}

		const slugInput = getArg("slug") ?? slugify(title);
		const slug = (await rl.question(`Slug (${slugInput}): `)).trim() || slugInput;
		if (!slugRegex.test(slug)) {
			console.error("Slug must be kebab-case (lowercase letters, numbers, hyphens).");
			process.exit(1);
		}

		const today = formatIsoDate(new Date());
		const dateInput =
			(getArg("date") ?? (await rl.question(`Date (${today}) [YYYY-MM-DD]: `)).trim()) ||
			today;

		const translationKeyInput = getArg("translationKey") ?? slug;
		const translationKey =
			(await rl.question(`translationKey (${translationKeyInput}): `)).trim() ||
			translationKeyInput;
		if (translationKey && !slugRegex.test(translationKey)) {
			console.error("translationKey must be kebab-case (lowercase letters, numbers, hyphens).");
			process.exit(1);
		}

		const tagsPath = path.join("src", "data", "tags.json");
		let availableTags = [];
		if (existsSync(tagsPath)) {
			const raw = await readFile(tagsPath, "utf8");
			availableTags = JSON.parse(raw);
		}

		if (availableTags.length > 0) {
			console.log("Available tags:");
			availableTags.forEach((tag, index) => {
				console.log(`  ${index + 1}) ${tag}`);
			});
		}

		const tagsInput = await rl.question(
			"Tags (numbers and/or names, comma-separated; empty for none): ",
		);
		const tokens = tagsInput
			.split(",")
			.map((token) => token.trim())
			.filter(Boolean);

		const tags = [];
		const customTags = [];
		for (const token of tokens) {
			if (/^\d+$/.test(token)) {
				const idx = Number(token) - 1;
				if (availableTags[idx]) tags.push(availableTags[idx]);
			} else {
				const normalized = slugify(token);
				if (normalized) {
					tags.push(normalized);
					customTags.push(normalized);
				}
			}
		}

		if (customTags.length > 0) {
			const merged = Array.from(
				new Set([...availableTags, ...customTags].map((tag) => tag.toLowerCase())),
			).sort((a, b) => a.localeCompare(b));
			await writeFile(tagsPath, JSON.stringify(merged, null, 2) + "\n");
			availableTags = merged;
		}

		return { title, slug, dateInput, translationKey, tags };
	} finally {
		rl.close();
	}
};

const main = async () => {
	const { title, slug, dateInput, translationKey, tags } =
		await promptIfMissing();

	const date = parseDateInput(dateInput);
	if (Number.isNaN(date.getTime())) {
		console.error("Invalid --date. Use YYYY-MM-DD.");
		process.exit(1);
	}

	const yyyy = String(date.getFullYear());
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const folder = path.join("src", "content", "blog", yyyy, mm, dd);

	if (existsSync(folder)) {
		const enPath = path.join(folder, "en.md");
		const esPath = path.join(folder, "es.md");
		if (existsSync(enPath) || existsSync(esPath)) {
			console.error(`Post folder already exists: ${folder}`);
			process.exit(1);
		}
	}

	await mkdir(folder, { recursive: true });

	const pubDate = date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const tagsLine =
		tags && tags.length > 0
			? `tags: [${tags.map((tag) => `'${tag}'`).join(", ")}]\n`
			: "tags: []\n";

	const frontmatter = (lang, description) =>
		`---\n` +
		`title: '${title}'\n` +
		`description: '${description}'\n` +
		`pubDate: '${pubDate}'\n` +
		`heroImage: './hero.png'\n` +
		`lang: '${lang}'\n` +
		`translationKey: '${translationKey}'\n` +
		`slug: '${slug}'\n` +
		tagsLine +
		`---\n\n`;

	const enBody = frontmatter("en", "TODO") + "Write your English content here.\n";
	const esBody =
		frontmatter("es", "TODO") + "Escribe tu contenido en español aquí.\n";

	await writeFile(path.join(folder, "en.md"), enBody);
	await writeFile(path.join(folder, "es.md"), esBody);

	const heroPath = path.join(folder, "hero.png");
	if (!existsSync(heroPath)) {
		const heroPngBase64 =
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/6XbXz8AAAAASUVORK5CYII=";
		const heroBuffer = Buffer.from(heroPngBase64, "base64");
		await writeFile(heroPath, heroBuffer);
	}

	console.log(`Created post skeleton in ${folder}`);
	console.log("Next: replace hero.png and update frontmatter/contents.");
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
