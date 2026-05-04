import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: 'posts/**/*.md', base: 'src/content/posts' }),
  schema: z.object({
    id: z.string(),
    title: z.string().default(''),
    date: z.coerce.date(),
    type: z.enum(['article', 'talk', 'content-placeholder']).default('article'),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    image: z.string().optional(),
    image_cropped: z.string().optional(),
    thumbnail: z.string().optional(),
    image_credit: z.string().optional(),
    alt_text: z.string().optional(),
    link: z.string().optional(),
  }),
});

export const collections = { posts };
