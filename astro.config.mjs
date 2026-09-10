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
		// Archived: "Mastering Instruments" series (moved out of the blog 2026-09-09).
		'/en/blog/mastering-xcode-instruments-mental-models-signposts': '/en/',
		'/es/blog/dominando-xcode-instruments-modelos-mentales-signposts': '/es/',
		'/en/blog/mastering-instruments-stack-heap-symbolication': '/en/',
		'/es/blog/dominando-instruments-stack-heap-simbolizacion': '/es/',
		'/en/blog/mastering-instruments-malloc-free-arc': '/en/',
		'/es/blog/dominando-instruments-malloc-free-arc': '/es/',
		'/en/blog/mastering-instruments-scientific-method-time-profiler': '/en/',
		'/es/blog/dominando-instruments-metodo-cientifico-time-profiler': '/es/',
		'/en/blog/mastering-instruments-flame-graphs-swift-concurrency': '/en/',
		'/es/blog/dominando-instruments-flame-graphs-swift-concurrency': '/es/',
		// Archived: "Swift from Zero to Expert" series (moved out of the blog 2026-09-09).
		'/en/blog/swift-zero-expert-data-types-operators': '/en/',
		'/es/blog/swift-cero-experto-tipos-datos-operadores': '/es/',
		'/en/blog/swift-zero-expert-collections': '/en/',
		'/es/blog/swift-cero-experto-colecciones': '/es/',
		'/en/blog/swift-zero-expert-strings-characters': '/en/',
		'/es/blog/swift-cero-experto-strings-characters': '/es/',
		'/en/blog/swift-zero-expert-control-flow': '/en/',
		'/es/blog/swift-cero-experto-control-flujo': '/es/',
		'/en/blog/swift-zero-expert-functions': '/en/',
		'/es/blog/swift-cero-experto-funciones': '/es/',
		'/en/blog/swift-zero-expert-closures': '/en/',
		'/es/blog/swift-cero-experto-closures': '/es/',
		'/en/blog/swift-zero-expert-enumerations': '/en/',
		'/es/blog/swift-cero-experto-enumeraciones': '/es/',
		'/en/blog/swift-zero-expert-structs-vs-classes': '/en/',
		'/es/blog/swift-cero-experto-structs-vs-classes': '/es/',
		'/en/blog/swift-zero-expert-properties-methods-subscripts': '/en/',
		'/es/blog/swift-cero-experto-propiedades-metodos-subscripts': '/es/',
		'/en/blog/swift-zero-expert-inheritance-initialization': '/en/',
		'/es/blog/swift-cero-experto-herencia-inicializacion': '/es/',
		'/en/blog/swift-zero-expert-optionals': '/en/',
		'/es/blog/swift-cero-experto-opcionales': '/es/',
		'/en/blog/swift-zero-expert-error-handling': '/en/',
		'/es/blog/swift-cero-experto-manejo-errores': '/es/',
		'/en/blog/swift-zero-expert-protocols': '/en/',
		'/es/blog/swift-cero-experto-protocolos': '/es/',
		'/en/blog/swift-zero-expert-generics': '/en/',
		'/es/blog/swift-cero-experto-genericos': '/es/',
		'/en/blog/swift-zero-expert-opaque-types': '/en/',
		'/es/blog/swift-cero-experto-tipos-opacos': '/es/',
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
