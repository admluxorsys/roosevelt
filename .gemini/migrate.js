const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountString) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountString)) });
} else {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch(e) {
        console.error("No service account.");
        process.exit(1);
    }
}

const db = admin.firestore();
const auth = admin.auth();

async function run() {
    let email = "udreamms@gmail.com";
    let entityId = "udreamms";
    
    console.log("Buscando usuario:", email);
    let targetUser = null;
    try {
        targetUser = await auth.getUserByEmail(email);
    } catch (e) {
        console.log("Revisando listUsers por si hay conflictos...");
        const list = await auth.listUsers();
        targetUser = list.users.find(u => u.email === email && u.providerData.some(p => p.providerId === 'google.com'));
    }
    
    if (!targetUser) {
         console.error("❌ Usuario no encontrado!");
         process.exit(1);
    }

    console.log("✅ Usuario encontrado, ID:", targetUser.uid);
    const userId = targetUser.uid;

    const baseRef = db.collection('users').doc(userId).collection('entities').doc(entityId);

    // 1. MUDAR Y LIMPIAR WEB-PROJECTS
    const wpRef = db.collection('web-projects');
    const wpSnap = await wpRef.get();
    console.log(`\n📚 Encontrados ${wpSnap.size} web-projects globales para migrar.`);

    for (const docSnap of wpSnap.docs) {
        const destRef = baseRef.collection('web-projects').doc(docSnap.id);
        await destRef.set(docSnap.data());
        console.log(" ➜ Web-project copiado:", docSnap.id);

        // Mover subcolecciones: files
        const filesSnap = await docSnap.ref.collection('files').get();
        for (const fileDoc of filesSnap.docs) {
            await destRef.collection('files').doc(fileDoc.id).set(fileDoc.data());
            await fileDoc.ref.delete();
        }

        // Mover subcolecciones: conversations
        const convSnap = await docSnap.ref.collection('conversations').get();
        for (const convDoc of convSnap.docs) {
            await destRef.collection('conversations').doc(convDoc.id).set(convDoc.data());
            // Mover mensajes
            const msgSnap = await convDoc.ref.collection('messages').get();
            for (const msgDoc of msgSnap.docs) {
                await destRef.collection('conversations').doc(convDoc.id).collection('messages').doc(msgDoc.id).set(msgDoc.data());
                await msgDoc.ref.delete();
            }
            await convDoc.ref.delete();
        }

        await docSnap.ref.delete();
        console.log("   ✓ Eliminado de la raíz");
    }

    // 2. MUDAR Y LIMPIAR CHATBOTS (A IDs SECUENCIALES: 00000000000000000001)
    const cbRef = db.collection('chatbots');
    const cbSnap = await cbRef.get();
    console.log(`\n🤖 Encontrados ${cbSnap.size} chatbots globales para migrar.`);
    
    let counter = 1;
    for (const docSnap of cbSnap.docs) {
        // Construir string de 20 dígitos: 0000...001
        const newId = String(counter).padStart(20, '0');
        const destRef = baseRef.collection('chatbots').doc(newId);
        await destRef.set(docSnap.data());
        console.log(` ➜ Chatbot migrado con ID numérico: [${docSnap.id}] -> [${newId}]`);
        // Borrar el original global
        await docSnap.ref.delete();
        counter++;
    }

    console.log("\n🚀 Migración finalizada con éxito y la raíz ha sido limpiada.");
}

run().catch(console.error);
