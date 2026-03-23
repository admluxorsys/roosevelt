import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Check if firebase-admin has already been initialized to avoid "already exists" error in dev
if (!admin.apps.length) {
    try {
        // In production/Vercel/Cloud Run, this usually uses GOOGLE_APPLICATION_CREDENTIALS
        // In local dev, we check for serviceAccountKey.json
        // Note: In Next.js Edge Runtime this might have issues, but we are using Node.js runtime for api routes by default.

        // 1. Check for Service Account in Environment Variable (Preferred for security/CI/Vercel)
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        // Search in current dir and parent to be safe (Next.js context can vary)
        const possiblePaths = [
            path.join(process.cwd(), 'serviceAccountKey.json'),
            path.join(__dirname, '..', '..', '..', '..', 'serviceAccountKey.json'), // Inside .next or src
        ];

        let serviceAccountPath = possiblePaths.find(p => fs.existsSync(p));

        if (serviceAccountEnv) {
            try {
                const serviceAccount = JSON.parse(serviceAccountEnv);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId
                });
                console.log(`[Firebase Admin] ✅ SUCCESS: Initialized from FIREBASE_SERVICE_ACCOUNT env.`);
            } catch (jsonError) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable. Ensuring it is a valid JSON string.');
                throw jsonError;
            }
        } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId
            });
            console.log(`[Firebase Admin] ✅ SUCCESS: Initialized for project ${projectId} with serviceAccountKey.json at ${serviceAccountPath}`);
        } else {
            console.warn(`[Firebase Admin] ⚠️ WARNING: Service account file NOT found in possible paths.`);
            console.warn(`[Firebase Admin] Falling back to default credentials (ADC) for project: ${projectId}`);
            admin.initializeApp({
                projectId
            });
            console.log(`[Firebase Admin] Initialized for ${projectId} with default credentials/ADC`);
        }
    } catch (error: any) {
        // Build-time graceful failure
        if (process.env.NEXT_PHASE === 'phase-production-build') {
            console.warn('[Firebase Admin] ⏳ Skipping initialization during build phase (No credentials found/provided).');
        } else {
            console.error('CRITICAL: Failed to initialize Firebase Admin:', error.message);
            if (error.code === 'permission-denied' || error.message?.includes('PERMISSION_DENIED')) {
                console.error('HINT: This is usually because your local environment lacks GOOGLE_APPLICATION_CREDENTIALS or a Service Account Key.');
            }
        }
    }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };

