"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = exports.admin = void 0;
var admin = require("firebase-admin");
var path = require("path");
var fs = require("fs");
// Helper to get Firebase Admin instance
function getFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            var projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            var serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
            // Critical Fix: Remove surrounding single/double quotes if present from .env
            if (serviceAccountEnv) {
                serviceAccountEnv = serviceAccountEnv.trim();
                if ((serviceAccountEnv.startsWith("'") && serviceAccountEnv.endsWith("'")) ||
                    (serviceAccountEnv.startsWith('"') && serviceAccountEnv.endsWith('"'))) {
                    serviceAccountEnv = serviceAccountEnv.substring(1, serviceAccountEnv.length - 1);
                }
            }
            var possiblePaths = [
                path.join(process.cwd(), 'serviceAccountKey.json'),
                path.join(__dirname, '..', '..', '..', 'serviceAccountKey.json'),
            ];
            var serviceAccountPath = possiblePaths.find(function (p) { return fs.existsSync(p); });
            if (serviceAccountEnv) {
                try {
                    var serviceAccount = JSON.parse(serviceAccountEnv);
                    // Mismatch check
                    if (serviceAccount.project_id && projectId && serviceAccount.project_id !== projectId) {
                        console.error("[Firebase Admin] \u274C MISMATCH: Service account is for '".concat(serviceAccount.project_id, "' but env project is '").concat(projectId, "'"));
                    }
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                        projectId: projectId
                    });
                    console.log("[Firebase Admin] \u2705 SUCCESS: Initialized from ENV.");
                }
                catch (jsonError) {
                    console.error('[Firebase Admin] ❌ JSON Parse Error:', jsonError.message);
                    // Probar inicialización por defecto si el JSON falla pero hay projectId
                    admin.initializeApp({ projectId: projectId });
                }
            }
            else if (serviceAccountPath) {
                var serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: projectId
                });
                console.log("[Firebase Admin] \u2705 SUCCESS: Initialized from file.");
            }
            else {
                admin.initializeApp({ projectId: projectId });
                console.log("[Firebase Admin] Initialized with default credentials (ADC).");
            }
        }
        catch (error) {
            console.error('[Firebase Admin] ❌ CRITICAL ERROR:', error.message);
        }
    }
    return admin;
}
var firebaseAdmin = getFirebaseAdmin();
exports.admin = firebaseAdmin;
var db = firebaseAdmin.firestore();
exports.db = db;
var auth = firebaseAdmin.auth();
exports.auth = auth;
