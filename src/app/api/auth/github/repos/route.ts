import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('github_token')?.value;

        if (!token) {
            return NextResponse.json({ repos: [] }, { status: 401 });
        }

        // Fetch user's repositories
        // We fetch both owned and participated repos, sorted by pushed date
        const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            cache: 'no-store',
        });

        if (!reposRes.ok) {
            const errorData = await reposRes.json();
            return NextResponse.json({ error: errorData.message || 'Failed to fetch repositories' }, { status: reposRes.status });
        }

        const repos = await reposRes.json();

        // Filter and map only necessary data
        const simplifiedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
            private: repo.private,
            description: repo.description,
            updated_at: repo.updated_at
        }));

        return NextResponse.json({ repos: simplifiedRepos });
    } catch (e: any) {
        console.error('[GitHub repos API]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

