import type { MetadataRoute } from 'next';

// Allow all crawlers (incl. Google Scholar's) and point them at the sitemap so the
// /paper page and its PDF — which carry the citation_* meta tags — get indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://mandatebench.xyz/sitemap.xml',
    host: 'https://mandatebench.xyz',
  };
}
