import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get('code');
    const stateRaw = searchParams.get('state') || '';

    let projectId = '';
    try {
        const parsed = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf-8'));
        projectId = parsed.projectId || '';
    } catch {
        // state might not be parseable, that's ok
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/nucleo/udreamms/cto/web-builder?github_error=no_code`);
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error('[GitHub OAuth] Token exchange failed:', tokenData);
            return NextResponse.redirect(`${origin}/nucleo/udreamms/cto/web-builder?github_error=token_failed`);
        }

        // Get GitHub user info
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        const userData = await userRes.json();

        // Build redirect back to the web builder with success
        const redirectUrl = new URL(`${origin}/nucleo/udreamms/cto/web-builder`);
        if (projectId) redirectUrl.searchParams.set('projectId', projectId);
        redirectUrl.searchParams.set('github_connected', '1');
        redirectUrl.searchParams.set('github_user', userData.login || '');

        // Set the token as an HttpOnly cookie so the git route can use it
        const response = NextResponse.redirect(redirectUrl.toString());
        response.cookies.set('github_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
    } catch (error: any) {
        console.error('[GitHub OAuth] Error:', error);
        return NextResponse.redirect(`${origin}/nucleo/udreamms/cto/web-builder?github_error=${encodeURIComponent(error.message)}`);
    }
}

