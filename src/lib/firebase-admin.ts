import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Patrón Singleton para evitar múltiples inicializaciones
if (!admin.apps.length) {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        let serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        const possiblePaths = [
            path.join(process.cwd(), 'serviceAccountKey.json'),
            path.join(__dirname, '..', '..', '..', 'serviceAccountKey.json'),
        ];
        let serviceAccountPath = possiblePaths.find(p => fs.existsSync(p));
        let initialized = false;

        if (serviceAccountEnv) {
            try {
                // Remove possible wrapping quotes (handles some OS/env issues)
                let cleanedEnv = serviceAccountEnv.trim();
                while ((cleanedEnv.startsWith("'") && cleanedEnv.endsWith("'")) || 
                       (cleanedEnv.startsWith('"') && cleanedEnv.endsWith('"'))) {
                    cleanedEnv = cleanedEnv.slice(1, -1);
                }
                
                let parsedServiceAccount;
                try {
                    // Strategy 1: Standard double-escaped newlines in JSON
                    parsedServiceAccount = JSON.parse(cleanedEnv);
                } catch (firstErr) {
                    // Strategy 2: Attempt to unescape \n sequences in the raw string if Strategy 1 fails
                    // This handles cases where Vercel/CI might have double-escaped the JSON entry
                    const fixedRaw = cleanedEnv.replace(/\\n/g, '\n');
                    parsedServiceAccount = JSON.parse(fixedRaw);
                }

                // Strategy 3: Ensure the private_key specifically has real newlines
                // Firebase Admin SDK cert() is very picky about the 0x0A character
                if (parsedServiceAccount.private_key && typeof parsedServiceAccount.private_key === 'string') {
                    parsedServiceAccount.private_key = parsedServiceAccount.private_key.replace(/\\n/g, '\n');
                }

                // Ensure project_id is present because cert() absolutely requires it
                if (!parsedServiceAccount.project_id) {
                    parsedServiceAccount.project_id = projectId;
                }

                admin.initializeApp({
                    credential: admin.credential.cert(parsedServiceAccount),
                    projectId
                });
                
                console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from ENV.`);
                initialized = true;
            } catch (jsonError: any) {
                console.error('[Firebase Admin] ❌ Error initializing from ENV (Is the object malformed or missing fields like project_id/private_key/client_email?):', jsonError.message);
                throw jsonError; // Do not swallow so we can see it in Vercel logs instead of "Could not load default credentials"
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

