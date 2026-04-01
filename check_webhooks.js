const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkDebugWebhooks() {
    console.log('Checking _debug_webhooks collection...');
    const snapshot = await db.collection('_debug_webhooks').orderBy('timestamp', 'desc').limit(5).get();
    
    if (snapshot.empty) {
        console.log('No debug webhooks found.');
        return;
    }

    snapshot.forEach(doc => {
        console.log('--- Webhook ---');
        console.log('ID:', doc.id);
        console.log('Timestamp:', doc.data().timestamp?.toDate());
        console.log('Type:', doc.data().type);
        console.log('Raw:', doc.data().raw?.substring(0, 500));
    });
}

checkDebugWebhooks().catch(console.error);
