const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkIntegrations() {
    console.log('--- INTEGRATIONS ACROSS ALL TENANTS ---');
    const snapshot = await db.collectionGroup('integrations').get();
    
    if (snapshot.empty) {
        console.log('No integrations found.');
        return;
    }

    snapshot.forEach(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        console.log(`Path: ${path}`);
        console.log(`  Platform: ${data.platform || 'unknown'}`);
        console.log(`  PhoneID: ${data.phoneNumberId || 'N/A'}`);
        console.log(`  VerifyToken: ${data.verifyToken || 'N/A'}`);
        console.log(`  WABA: ${data.wabaId || 'N/A'}`);
    });
}

checkIntegrations().catch(console.error);
