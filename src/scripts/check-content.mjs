import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseFrontmatter = (content) => {
	if (!content.startsWith("---")) return null;
	const end = content.indexOf("\n---", 3);
	if (end === -1) return null;
	const block = content.slice(3, end).trim();
	const lines = block.split("\n");
	const data = {};
	let currentKey = null;
	for (const line of lines) {
		if (/^\s*-\s+/.test(line) && currentKey) {
			data[currentKey] = data[currentKey] ?? [];
			data[currentKey].push(line.replace(/^\s*-\s+/, "").trim());
			continue;
		}
		const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
		if (!match) continue;
		const [, key, rawValue] = match;
		currentKey = key;
		if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			const inner = rawValue.slice(1, -1).trim();
			data[key] = inner
				? inner.split(",").map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))
				: [];
		} else {
			data[key] = rawValue.replace(/^['\"]|['\"]$/g, "");
		}
	}
	return data;
};

const listMarkdownFiles = async () => {
	try {
		const { stdout } = await execFileAsync("rg", ["--files", "src/content/blog", "-g", "*.md"]);
		return stdout.split("\n").filter(Boolean);
	} catch {
		return [];
	}
};

const files = await listMarkdownFiles();
if (files.length === 0) {
	console.error("No markdown files found under src/content/blog.");
	process.exit(1);
}

let hasErrors = false;
for (const file of files) {
	const content = await readFile(file, "utf8");
	const fm = parseFrontmatter(content);
	if (!fm) {
		console.error(`Missing or invalid frontmatter: ${file}`);
		hasErrors = true;
		continue;
	}

	const slug = fm.slug;
	if (!slug || !slugRegex.test(slug)) {
		console.error(`Invalid or missing slug in ${file}`);
		hasErrors = true;
	}

	if (fm.translationKey && !slugRegex.test(fm.translationKey)) {
		console.error(`Invalid translationKey in ${file}`);
		hasErrors = true;
	}

	if (!fm.pubDate || Number.isNaN(new Date(fm.pubDate).getTime())) {
		console.error(`Invalid or missing pubDate in ${file}`);
		hasErrors = true;
	}

	if (fm.heroImage) {
		const heroPath = path.resolve(path.dirname(file), fm.heroImage);
		if (!existsSync(heroPath)) {
			console.error(`heroImage not found: ${heroPath}`);
			hasErrors = true;
		}
	}
}

if (hasErrors) {
	process.exit(1);
}

console.log("Content check passed.");
