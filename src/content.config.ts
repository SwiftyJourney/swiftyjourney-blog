import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			lang: z.enum(['es', 'en']).default('en'),
			translationKey: z
				.string()
				.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
				.optional(), // Key to link related articles across languages
			slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), // flat URL slug (ignores folders)
			tags: z.array(z.string().min(1)).optional(),
		}),
});

export const collections = { blog };
