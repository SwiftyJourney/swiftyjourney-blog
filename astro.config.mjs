// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

const shiki = {
	theme: 'github-light',
	langs: [
		'swift',
		'typescript',
		'javascript',
		'json',
		'bash',
		'yaml',
		'markdown',
		'xml',
		'css',
		'html',
		'gherkin',
		'mermaid',
	],
	wrap: true,
};

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.swiftyjourney.com',
	redirects: {
		'/en/blog': '/en/',
		'/es/blog': '/es/',
	},
	integrations: [
		mdx({
			syntaxHighlight: 'shiki',
			shikiConfig: shiki,
			rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg' }]],
		}),
		sitemap(),
		icon(),
		react(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
	],
	vite: {
		plugins: [tailwind()],
	},
	markdown: {
		syntaxHighlight: 'shiki',
		shikiConfig: shiki,
		rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg' }]],
	},
});
