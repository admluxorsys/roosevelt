import { NextRequest, NextResponse } from 'next/server';
import { generatePreviewHTML } from './engine';

/**
 * Preview Endpoint - Server-Side Transpilation
 * 
 * Receives virtual files from the web builder, transpiles them server-side,
 * and returns a pre-compiled HTML bundle ready to render.
 * 
 * Uses the robust OmniShield v8.5.1 engine to prevent loading errors.
 */

export async function POST(req: NextRequest) {
    try {
        const { files } = await req.json();

        if (!files || typeof files !== 'object') {
            return NextResponse.json({ error: 'Invalid files object' }, { status: 400 });
        }

        console.log("[Preview API - OmniShield] Incoming files:", Object.keys(files).length);

        // Generate HTML with robust OmniShield engine
        const html = generatePreviewHTML(files);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        console.error('[Preview API] Error:', error);
        return NextResponse.json({
            error: 'Preview generation failed',
            details: error.message
        }, { status: 500 });
    }
}

