// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.swiftyjourney.com',
	integrations: [mdx(), sitemap(), icon()],
	vite: {
		plugins: [tailwind()],
	},
});
