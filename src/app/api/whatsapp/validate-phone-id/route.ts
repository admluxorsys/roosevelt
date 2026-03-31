import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { phoneNumberId, userId, entityId } = await req.json();

        if (!phoneNumberId) {
            return NextResponse.json({ valid: false, message: 'Falta el Phone ID.' });
        }

        // Rule 4: Isolated Data Vault - Using collectionGroup to find duplicates across tenants
        // without violating Rule 7: No Global Mapping Roots
        const integrationsSnap = await db.collectionGroup('integrations')
            .where('phoneNumberId', '==', String(phoneNumberId))
            .get();

        if (!integrationsSnap.empty) {
            // Check if any of the found docs belong to a DIFFERENT tenant/entity
            for (const doc of integrationsSnap.docs) {
                const pathParts = doc.ref.path.split('/');
                // Path pattern: users/{uid}/entities/{eid}/integrations/{integrationId}
                const docUserId = pathParts[1];
                const docEntityId = pathParts[3];

                if (docUserId !== userId || docEntityId !== entityId) {
                    console.log(`[Validation] ❌ Duplicate Phone ID ${phoneNumberId} found in ${doc.ref.path}`);
                    return NextResponse.json({ 
                        valid: false, 
                        message: 'Este Phone ID ya está vinculado a otra cuenta de Roosevelt. Por favor usa una App de Meta diferente o contacta a soporte.' 
                    });
                }
            }
        }

        console.log(`[Validation] ✅ Phone ID ${phoneNumberId} is valid for User: ${userId}, Entity: ${entityId}`);
        return NextResponse.json({ valid: true });

    } catch (error: any) {
        console.error('[Validation API Error]:', error.message);
        return NextResponse.json({ valid: false, message: 'Error interno de validación.' }, { status: 500 });
    }
}
