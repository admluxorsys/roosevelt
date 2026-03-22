import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || '';

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
        return NextResponse.json({ error: 'GitHub Client ID not configured' }, { status: 500 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin}/api/auth/github/callback`;
    const state = Buffer.from(JSON.stringify({ projectId })).toString('base64');

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'repo user:email',
        state,
    });

    return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

