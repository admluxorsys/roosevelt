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
        console.error('[Validation API Error]:\n\n====================\nAtención! Copia este error (incluyendo el link si lo hay):\n', error.message, '\n====================\n');
        // Devolvemos 200 para que NextJS no intercepte el 500 con un HTML de error y el frontend pueda leer el JSON.
        return NextResponse.json({ 
            valid: false, 
            message: error.message.includes('index') 
                ? 'Firebase requiere un "Índice (Index)" para validar este número. Revisa la terminal (consola negra) abajo donde corre "npm run dev", y haz clic en el link que Firebase generó para crearlo automáticamente.'
                : error.message 
        }, { status: 200 }); // Status 200 para forzar a la UI a mostrar el mensaje real
    }
}
