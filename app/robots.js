export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://andor.travels';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/itinerary/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
