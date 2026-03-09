import { NextRequest, NextResponse } from 'next/server';
import { FirebaseHostingService } from '@/lib/hosting';

export async function POST(req: NextRequest) {
    try {
        const { siteId, files } = await req.json();

        if (!siteId || !files || typeof files !== 'object') {
            return NextResponse.json({
                error: 'Faltan parámetros: siteId y files son requeridos.'
            }, { status: 400 });
        }

        console.log(`[Deploy API] Iniciando despliegue para el sitio: ${siteId}`);
        const hostingService = new FirebaseHostingService();

        // 1. Crear el sitio (si no existe)
        await hostingService.createSite(siteId);

        // 2. Desplegar los archivos
        const result = await hostingService.deployFiles(siteId, files);

        console.log(`[Deploy API] Despliegue exitoso: ${result.url}`);

        return NextResponse.json({
            success: true,
            siteId,
            url: result.url,
            version: result.version
        });

    } catch (error: any) {
        console.error('[Deploy API] Error durante el despliegue:', error);

        // Manejo de errores específicos de la API de Google
        const errorMessage = error.response?.data?.error?.message || error.message;
        const statusCode = error.response?.status || 500;

        return NextResponse.json({
            success: false,
            error: 'Falló el despliegue programático.',
            details: errorMessage
        }, { status: statusCode });
    }
}
