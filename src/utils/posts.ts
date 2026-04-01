import { getCollection } from "astro:content";

const isDev = import.meta.env.DEV;

export async function getPublishedPosts() {
	const allPosts = await getCollection("blog");
	if (isDev) return allPosts;

	const now = new Date();
	return allPosts.filter((post) => post.data.pubDate.valueOf() <= now.valueOf());
}
