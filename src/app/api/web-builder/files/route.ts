
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Helper to encode/decode paths for Firestore IDs (slash is reserved)
const encodePath = (p: string) => encodeURIComponent(p).replace(/\./g, '%2E');
// const decodePath = (p: string) => decodeURIComponent(p.replace(/%2E/g, '.'));

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    try {
        const filesSnapshot = await db.collection('web-projects').doc(projectId).collection('files').get();
        const files: Record<string, string> = {};

        filesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.path && data.content !== undefined) {
                files[data.path] = data.content;
            }
        });

        return NextResponse.json(files);
    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { projectId, filePath, content } = await req.json();

        if (!projectId || !filePath || content === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const encodedId = encodePath(filePath);

        await db.collection('web-projects').doc(projectId).collection('files').doc(encodedId).set({
            path: filePath,
            content,
            updatedAt: Date.now()
        });

        // Update project lastModified
        await db.collection('web-projects').doc(projectId).update({
            lastModified: Date.now()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { projectId, filePath } = await req.json();

        if (!projectId || !filePath) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const encodedId = encodePath(filePath);
        await db.collection('web-projects').doc(projectId).collection('files').doc(encodedId).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}

