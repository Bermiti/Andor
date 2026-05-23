export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://andor.travels';
  
  // Static routes
  const staticPaths = [
    '',
    '/pricing',
    '/favorites',
    '/profile',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic destinations
  const slugs = ['tokyo', 'paris', 'bali', 'newyork', 'lisboa', 'barcelona', 'roma', 'santorini'];
  const destinationPaths = slugs.map((slug) => ({
    url: `${baseUrl}/destination/${slug}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPaths, ...destinationPaths];
}
