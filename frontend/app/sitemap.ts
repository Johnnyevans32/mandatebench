import type { MetadataRoute } from 'next';

const BASE = 'https://mandatebench.xyz';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/paper`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/mandatebench.pdf`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/dashboard`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ];
}
