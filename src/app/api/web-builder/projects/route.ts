import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Update project metadata
export async function PATCH(req: Request) {
    try {
        const { projectId, userId, entityId, ...updates } = await req.json();

        if (!projectId || !userId || !entityId) {
            return NextResponse.json({ error: 'Project ID, User ID and Entity ID are required' }, { status: 400 });
        }

        // Update project in Firestore
        await db.collection('users').doc(userId).collection('entities').doc(entityId).collection('web-projects').doc(projectId).update({
            ...updates,
            lastModified: Date.now()
        });

        return NextResponse.json({ success: true, message: 'Project updated successfully' });

    } catch (error: any) {
        console.error('[Projects API] PATCH Error:', error);
        if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
            return NextResponse.json({
                error: 'Permission Denied: Firebase Admin not properly authenticated. Check FIREBASE_SERVICE_ACCOUNT env var.'
            }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete project and all its subcollections (files, conversations)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const entityId = searchParams.get('entityId');

        if (!projectId || !userId || !entityId) {
            return NextResponse.json({ error: 'Project ID, User ID and Entity ID are required' }, { status: 400 });
        }

        const projectRef = db.collection('users').doc(userId).collection('entities').doc(entityId).collection('web-projects').doc(projectId);

        // Delete files subcollection
        const filesSnapshot = await projectRef.collection('files').get();
        const fileBatch = db.batch();
        filesSnapshot.docs.forEach(doc => fileBatch.delete(doc.ref));
        await fileBatch.commit();

        // Delete conversations subcollection
        const convSnapshot = await projectRef.collection('conversations').get();
        const convBatch = db.batch();
        convSnapshot.docs.forEach(doc => convBatch.delete(doc.ref));
        await convBatch.commit();

        // Finally delete the project document
        await projectRef.delete();

        return NextResponse.json({ success: true, message: 'Project and all associated data deleted successfully' });

    } catch (error: any) {
        console.error('[Projects DELETE API] Error:', error);
        if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
            return NextResponse.json({
                error: 'Permission Denied: Firebase Admin not properly authenticated. Check FIREBASE_SERVICE_ACCOUNT env var.'
            }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

