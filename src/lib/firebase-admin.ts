import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Helper to get Firebase Admin instance
function getFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            let serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
            
            // Critical Fix: Remove surrounding single/double quotes if present from .env
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

            if (serviceAccountEnv) {
                try {
                    const serviceAccount = JSON.parse(serviceAccountEnv);
                    
                    // Mismatch check
                    if (serviceAccount.project_id && projectId && serviceAccount.project_id !== projectId) {
                        console.error(`[Firebase Admin] ❌ MISMATCH: Service account is for '${serviceAccount.project_id}' but env project is '${projectId}'`);
                    }

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        projectId
                    });
                    console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from ENV.`);
                } catch (jsonError: any) {
                    console.error('[Firebase Admin] ❌ JSON Parse Error:', jsonError.message);
                    // Probar inicialización por defecto si el JSON falla pero hay projectId
                    admin.initializeApp({ projectId });
                }
            } else if (serviceAccountPath) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId
                });
                console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from file.`);
            } else {
                admin.initializeApp({ projectId });
                console.log(`[Firebase Admin] Initialized with default credentials (ADC).`);
            }
        } catch (error: any) {
            console.error('[Firebase Admin] ❌ CRITICAL ERROR:', error.message);
        }
    }
    return admin;
}

const firebaseAdmin = getFirebaseAdmin();
const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();

export { firebaseAdmin as admin, db, auth };

