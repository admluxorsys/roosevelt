const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountString) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountString)) });
} else {
    const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function explore() {
    try {
        const collections = await db.listCollections();
        console.log("Root Collections:");
        for (const col of collections) {
            console.log(" - " + col.id);
            const snapshot = await col.limit(1).get();
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const subcols = await doc.ref.listCollections();
                if (subcols.length > 0) {
                    console.log(`    Subcollections for ${col.id} / ${doc.id}:`);
                    for (const sub of subcols) {
                        console.log("      - " + sub.id);
                    }
                }
            } else {
                console.log(`    (Empty collection)`);
            }
        }
    } catch (e) {
        console.error("Error exploring DB:", e);
    }
}

explore();
