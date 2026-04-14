import type { MetadataRoute } from "next";

function blockSearchIndexing(): boolean {
  return process.env.BLOCK_SEARCH_INDEXING === "1";
}

export default function robots(): MetadataRoute.Robots {
  if (blockSearchIndexing()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
