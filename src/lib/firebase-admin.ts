import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Patrón Singleton para evitar múltiples inicializaciones
if (!admin.apps.length) {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        let serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (serviceAccountEnv) {
            serviceAccountEnv = serviceAccountEnv.trim();
            if ((serviceAccountEnv.startsWith("'") && serviceAccountEnv.endsWith("'")) ||
                (serviceAccountEnv.startsWith('"') && serviceAccountEnv.endsWith('"'))) {
                serviceAccountEnv = serviceAccountEnv.substring(1, serviceAccountEnv.length - 1);
            }
        }

        const possiblePaths = [
            path.join(process.cwd(), 'serviceAccountKey.json'),
            path.join(__dirname, '..', '..', '..', 'serviceAccountKey.json'),
        ];
        let serviceAccountPath = possiblePaths.find(p => fs.existsSync(p));

        let initialized = false;

        if (serviceAccountEnv) {
            try {
                const serviceAccount = JSON.parse(serviceAccountEnv);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId
                });
                console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from ENV.`);
                initialized = true;
            } catch (jsonError: any) {
                console.error('[Firebase Admin] ❌ JSON Parse Error from ENV:', jsonError.message);
            }
        }
        
        if (!initialized && serviceAccountPath) {
            try {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId
                });
                console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from file (${serviceAccountPath}).`);
                initialized = true;
            } catch (fileErr: any) {
                console.error('[Firebase Admin] ❌ Error loading from serviceAccountKey.json:', fileErr.message);
            }
        } 
        
        if (!initialized) {
            admin.initializeApp({ projectId });
            console.log(`[Firebase Admin] Initialized with default credentials (ADC).`);
        }
    } catch (error: any) {
        console.error('[Firebase Admin] ❌ CRITICAL ERROR:', error.message);
    }
}

// Exportar instancias directas
export const db = admin.firestore();
export const auth = admin.auth();
export { admin };

