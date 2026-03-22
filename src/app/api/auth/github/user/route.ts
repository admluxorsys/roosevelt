import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('github_token')?.value;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            cache: 'no-store',
        });

        if (!userRes.ok) {
            // token expired or invalid — clear it
            const response = NextResponse.json({ user: null }, { status: 200 });
            response.cookies.set('github_token', '', { maxAge: 0, path: '/' });
            return response;
        }

        const user = await userRes.json();
        return NextResponse.json({ user: { login: user.login, name: user.name, avatar_url: user.avatar_url } });
    } catch (e: any) {
        console.error('[GitHub user API]', e);
        return NextResponse.json({ user: null }, { status: 200 });
    }
}

// DELETE — disconnect: clear the cookie
export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('github_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}

