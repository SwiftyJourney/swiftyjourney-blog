// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.swiftyjourney.com',
	integrations: [
		mdx({
			syntaxHighlight: 'shiki',
			shikiConfig: {
				themes: {
					light: 'github-light',
					dark: 'one-dark-pro',
				},
				langs: ['swift', 'typescript', 'javascript', 'json', 'bash', 'yaml', 'markdown', 'xml', 'css', 'html', 'gherkin'],
				wrap: true,
			},
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
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'one-dark-pro',
			},
			langs: ['swift', 'typescript', 'javascript', 'json', 'bash', 'yaml', 'markdown', 'xml', 'css', 'html'],
			wrap: true,
		},
	},
});
