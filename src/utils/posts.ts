import { getCollection } from "astro:content";

const isDev = import.meta.env.DEV;

export async function getPublishedPosts() {
	const allPosts = await getCollection("blog");
	// Filter out entries with missing data (can happen during dev mode content sync)
	const validPosts = allPosts.filter((post) => post.data);
	if (isDev) return validPosts;

	const now = new Date();
	return validPosts.filter((post) => post.data.pubDate.valueOf() <= now.valueOf());
}
