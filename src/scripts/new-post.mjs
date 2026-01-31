import { mkdir, writeFile, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (name) => {
	const idx = args.indexOf(`--${name}`);
	return idx >= 0 ? args[idx + 1] : undefined;
};

const slug = getArg("slug");
const title = getArg("title") ?? "Untitled";
const dateInput = getArg("date");
const translationKey = getArg("translationKey") ?? slug;

if (!slug) {
	console.error("Missing --slug. Example: npm run new:post -- --slug my-article --title \"My Article\"");
	process.exit(1);
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if (!slugRegex.test(slug)) {
	console.error("Slug must be kebab-case (lowercase letters, numbers, hyphens).\nExample: my-article-title");
	process.exit(1);
}

if (translationKey && !slugRegex.test(translationKey)) {
	console.error("translationKey must be kebab-case (lowercase letters, numbers, hyphens).");
	process.exit(1);
}

const parseDateInput = (value) => {
	if (!value) return new Date();
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return new Date(NaN);
	const [, y, m, d] = match;
	return new Date(Number(y), Number(m) - 1, Number(d));
};

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

const frontmatter = (lang, description) => `---\n` +
	`title: '${title}'\n` +
	`description: '${description}'\n` +
	`pubDate: '${pubDate}'\n` +
	`heroImage: './hero.png'\n` +
	`lang: '${lang}'\n` +
	`translationKey: '${translationKey}'\n` +
	`slug: '${slug}'\n` +
	`tags: []\n` +
	`---\n\n`;

const enBody = frontmatter("en", "TODO") + "Write your English content here.\n";
const esBody = frontmatter("es", "TODO") + "Escribe tu contenido en español aquí.\n";

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
