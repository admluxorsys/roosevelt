
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try to read .env for service account
function getServiceAccount() {
    try {
        const envPath = path.join(__dirname, '../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT='(.+)'/s); // Regex for multi-line
        if (match) {
            return JSON.parse(match[1].replace(/\\n/g, '\n'));
        }
    } catch (e) {
        console.error('Error reading service account from .env', e);
    }
    return null;
}

const sa = getServiceAccount();

if (sa) {
    admin.initializeApp({
        credential: admin.credential.cert(sa)
    });
} else {
    admin.initializeApp({
        projectId: 'roosevelt-491004'
    });
}

const db = admin.firestore();

async function check() {
    const userId = 'g02IGViHitZjPK1OuCG7j5J3uK33';
    console.log(`Checking entities for user: ${userId}`);
    
    const entitiesRef = db.collection(`users/${userId}/entities`);
    const entitiesSnap = await entitiesRef.get();
    
    if (entitiesSnap.empty) {
        console.log('NO ENTITIES FOUND FOR THIS USER');
        return;
    }

    for (const entityDoc of entitiesSnap.docs) {
        const eid = entityDoc.id;
        console.log(`--- Entity: ${eid} ---`);
        
        const internalRef = db.doc(`users/${userId}/entities/${eid}/integrations/whatsapp_internal`);
        const internalSnap = await internalRef.get();
        
        if (internalSnap.exists) {
            console.log(`[${eid}] INTERNAL CONFIG:`, internalSnap.data());
        } else {
            console.log(`[${eid}] No internal config found`);
        }
        
        const publicRef = db.doc(`users/${userId}/entities/${eid}/integrations/whatsapp`);
        const publicSnap = await publicRef.get();
        if (publicSnap.exists) {
            console.log(`[${eid}] PUBLIC CONFIG:`, publicSnap.data());
        }
    }
}

check().catch(console.error);
