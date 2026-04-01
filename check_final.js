const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function scanCorrectVault(uid, eid) {
    console.log(`--- SCANNING VAULT: users/${uid}/entities/${eid} ---`);
    
    // 1. Contacts
    const contacts = await db.collection(`users/${uid}/entities/${eid}/contacts`).get();
    console.log(`- Contacts count: ${contacts.size}`);
    contacts.forEach(d => console.log(`  [Contact] ${d.data().name} | Phone: ${d.data().phone}`));

    // 2. Kanban Cards
    const groups = await db.collection(`users/${uid}/entities/${eid}/kanban-groups`).get();
    for (const group of groups.docs) {
        console.log(`- Group: ${group.data().name} (${group.id})`);
        const cards = await group.ref.collection('cards').get();
        console.log(`  Cards count: ${cards.size}`);
        cards.forEach(c => {
            console.log(`    [Card] ${c.data().contactName} | LastMsg: ${c.data().lastMessage} | Updated: ${c.data().updatedAt?.toDate()}`);
        });
    }
}

// THE CORRECT USER ID from the logs!
scanCorrectVault('g02IGViHitZjPKlOuCG7j5J3uK33', 'roosevelt').catch(console.error);
