import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Testing Firebase Admin SDK connection...');

        // Test 1: List collections
        const collections = await db.listCollections();
        const collectionNames = collections.map(col => col.id);

        // Test 2: Count documents in each collection
        const collectionStats = await Promise.all(
            collections.map(async (col) => {
                const snapshot = await col.count().get();
                return {
                    name: col.id,
                    documentCount: snapshot.data().count
                };
            })
        );

        // Test 3: Check auth users
        const userList = await auth.listUsers(10);

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            firestore: {
                connected: true,
                collections: collectionNames,
                stats: collectionStats,
                totalCollections: collections.length
            },
            auth: {
                connected: true,
                totalUsers: userList.users.length,
                users: userList.users.map(u => ({
                    uid: u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    createdAt: u.metadata.creationTime
                }))
            }
        };

        console.log('✅ Firebase connection test successful');
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('❌ Firebase connection test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

