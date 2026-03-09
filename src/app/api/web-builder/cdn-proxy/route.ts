import { NextRequest, NextResponse } from 'next/server';

/**
 * CDN Proxy v1.0
 * 
 * Bypasses network blocks by fetching CDNs through the backend.
 */

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // We use a simple fetch. Since it's server-side, it's not affected by CSP/CORS of the client's network.
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const content = await response.text();

        // Construct response with permissive headers
        return new NextResponse(content, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/javascript',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error: any) {
        console.error('[CDN-Proxy] Error:', error.message);
        return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
