
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadsDir(projectId: string) {
    const projectUploads = path.join(UPLOADS_DIR, projectId);
    try {
        await fs.access(projectUploads);
    } catch {
        await fs.mkdir(projectUploads, { recursive: true });
    }
    return projectUploads;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string;

        if (!file || !projectId) {
            console.error("Missing file or projectId in upload request");
            return NextResponse.json({ error: 'File and Project ID are required' }, { status: 400 });
        }

        const projectUploadsDir = await ensureUploadsDir(projectId);

        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const buffer = Buffer.from(await file.arrayBuffer());

        await fs.writeFile(path.join(projectUploadsDir, safeName), buffer);

        // Return public URL
        const publicUrl = `/uploads/${projectId}/${safeName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            name: safeName
        });

    } catch (error) {
        console.error("Upload failed", error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

