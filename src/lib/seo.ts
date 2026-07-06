type MetaTag = Record<string, string>;

export function buildHead(opts: {
  title: string;
  description: string;
  image?: string;
  lang?: string;
}): { meta: MetaTag[] } {
  const meta: MetaTag[] = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (opts.image) {
    meta.push({ property: "og:image", content: opts.image });
    meta.push({ name: "twitter:image", content: opts.image });
  }
  return { meta };
}
