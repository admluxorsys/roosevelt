const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkEntityDirectly(uid, eid) {
    console.log(`--- DIRECT SCAN: users/${uid}/entities/${eid} ---`);
    
    // 1. Logs
    const logs = await db.collection(`users/${uid}/entities/${eid}/system_logs`).orderBy('timestamp', 'desc').limit(5).get();
    if (logs.empty) console.log('No system_logs found.');
    else {
        console.log(`Found ${logs.size} recent logs:`);
        logs.forEach(doc => console.log(`  - ${doc.data().type} | ${doc.data().timestamp?.toDate()}`));
    }

    // 2. Contacts
    const contacts = await db.collection(`users/${uid}/entities/${eid}/contacts`).get();
    if (contacts.empty) console.log('No contacts found.');
    else {
        console.log(`Found ${contacts.size} contacts:`);
        contacts.forEach(doc => console.log(`  - ${doc.data().name} | ${doc.id}`));
    }

    // 3. Kanban
    const groups = await db.collection(`users/${uid}/entities/${eid}/kanban-groups`).get();
    for (const group of groups.docs) {
        const cards = await group.ref.collection('cards').get();
        if (!cards.empty) {
            console.log(`Group: ${group.data().name} | Found ${cards.size} cards:`);
            cards.forEach(doc => console.log(`  - ${doc.data().contactName} | Msg: ${doc.data().lastMessage}`));
        }
    }
}

// Scanning known test entity
checkEntityDirectly('PfwSF6yPmee21HGeuLsiX4JmErI3', 'roosevelt').catch(console.error);
