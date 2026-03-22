
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    try {
        const snapshot = await db.collection('web-projects').doc(projectId).collection('chats').orderBy('timestamp', 'asc').get();
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { projectId, message } = await req.json();

        if (!projectId || !message) {
            return NextResponse.json({ error: 'Project ID and message required' }, { status: 400 });
        }

        const newMessage = {
            ...message,
            timestamp: Date.now()
        };

        // If message has an ID, use it for idempotency or update
        const docId = message.id || crypto.randomUUID();
        await db.collection('web-projects').doc(projectId).collection('chats').doc(docId).set(newMessage);

        return NextResponse.json({ success: true, id: docId });
    } catch (error) {
        console.error('Error saving chat:', error);
        return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const chatsRef = db.collection('web-projects').doc(projectId).collection('chats');
        const snapshot = await chatsRef.get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chats:', error);
        return NextResponse.json({ error: 'Failed to delete chats' }, { status: 500 });
    }
}

