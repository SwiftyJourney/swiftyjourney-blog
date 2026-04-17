// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import expressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.swiftyjourney.com',
	redirects: {
		'/en/blog': '/en/',
		'/es/blog': '/es/',
	},
	integrations: [
		expressiveCode({
			themes: ['github-light'],
			useDarkModeMediaQuery: false,
			themeCssSelector: false,
			defaultProps: {
				wrap: true,
				overridesByLang: {
					'bash,shell,sh,zsh,powershell': { frame: 'terminal' },
				},
			},
			styleOverrides: {
				borderColor: 'var(--color-border)',
				borderRadius: 'var(--radius-md)',
				codeBackground: 'var(--color-surface)',
				codeFontFamily:
					"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeFontSize: '0.875rem',
				codeLineHeight: '1.6',
				codePaddingBlock: '1rem',
				codePaddingInline: '1.25rem',
				frames: {
					editorActiveTabBackground: 'var(--color-surface)',
					editorActiveTabBorderColor: 'var(--color-border)',
					editorActiveTabIndicatorBottomColor: 'var(--color-accent)',
					editorActiveTabIndicatorTopColor: 'transparent',
					editorTabBarBackground: 'var(--color-surface-alt)',
					editorTabBarBorderBottomColor: 'var(--color-border)',
					editorTabsMarginInlineStart: '0',
					frameBoxShadowCssValue: '0 1px 2px rgba(11, 11, 12, 0.04)',
					terminalBackground: 'var(--color-surface)',
					terminalTitlebarBackground: 'var(--color-surface-alt)',
					terminalTitlebarBorderBottomColor: 'var(--color-border)',
					terminalTitlebarForeground: 'var(--color-text-muted)',
				},
				uiFontFamily: 'var(--font-sans)',
				uiFontSize: '0.75rem',
			},
		}),
		mdx(),
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
		rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg' }]],
	},
});
