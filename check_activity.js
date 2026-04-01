const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkRecentActivity() {
    console.log('--- RECENT ACTIVITY SCAN (Master Mold Context) ---');
    
    // 1. Check ALL system_logs for the last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    try {
        const logsSnapshot = await db.collectionGroup('system_logs')
            .where('timestamp', '>', tenMinsAgo)
            .orderBy('timestamp', 'desc')
            .get();
        
        if (logsSnapshot.empty) {
            console.log('No recent system_logs found.');
        } else {
            console.log(`Found ${logsSnapshot.size} recent system_logs entries:`);
            logsSnapshot.forEach(doc => {
                console.log(`- Path: ${doc.ref.path}`);
                console.log(`  Type: ${doc.data().type}`);
                console.log(`  Timestamp: ${doc.data().timestamp?.toDate()}`);
            });
        }
    } catch (err) {
        console.log('Error checking system_logs (maybe missing index?):', err.message);
    }

    // 2. Check ALL cards for the last 10 minutes
    try {
        const cardsSnapshot = await db.collectionGroup('cards')
            .where('updatedAt', '>', tenMinsAgo)
            .get();
        
        if (cardsSnapshot.empty) {
            console.log('No recent cards found.');
        } else {
            console.log(`Found ${cardsSnapshot.size} recent cards entries:`);
            cardsSnapshot.forEach(doc => {
                console.log(`- Path: ${doc.ref.path}`);
                console.log(`  Contact: ${doc.data().contactName || doc.data().contactNumber}`);
                console.log(`  LastMsg: ${doc.data().lastMessage}`);
            });
        }
    } catch (err) {
        console.log('Error checking cards:', err.message);
    }

    // 3. Check ALL contacts for the last 10 minutes
    try {
        const contactsSnapshot = await db.collectionGroup('contacts')
            .where('updatedAt', '>', tenMinsAgo.toISOString()) // Some might use ISO string
            .get();
        
        if (contactsSnapshot.empty) {
            console.log('No recent contacts found.');
        } else {
            console.log(`Found ${contactsSnapshot.size} recent contacts entries:`);
            contactsSnapshot.forEach(doc => {
                console.log(`- Path: ${doc.ref.path}`);
                console.log(`  Name: ${doc.data().name}`);
            });
        }
    } catch (err) {
        console.log('Error checking contacts:', err.message);
    }
}

checkRecentActivity().catch(console.error);
