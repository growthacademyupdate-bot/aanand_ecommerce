import { NextResponse } from 'next/server';

/** CDN + browser cache for public catalog APIs (reduces Vercel function invocations). */
export function withPublicCache(response: NextResponse, maxAgeSeconds = 60): NextResponse {
  const stale = maxAgeSeconds * 5;
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${stale}`
  );
  return response;
}
