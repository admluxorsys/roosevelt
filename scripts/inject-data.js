
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// THE PRIVATE KEY PROVIDED BY THE USER (Manual clean fix)
const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCi52k7C9Y+85ln\nUB0KK5Q9qAT+ijQkyPLU/RjdYJqpDkb1PL+RbDQGRIxMRO2EUgrWTd35aRy81nHC\n39SQGHaJqPeDNfnohPMHwTpYf/x5NNnUIuQKM/RseY/0hRmy61S5xPzHnFBI0iEI\n2ZSdIsS+RLIt5JPkia3EWRl/PD+RQdLz8yQmwMRzxLhLOe7jjJcYAKlXIUhIPBIb\nBEmUOKltTh1DNVX0eFfOe25Ti2nmrNsYPBFvMNbcezslnQLlEZ8StfCBdkZYJoxz\n/S0ywh8N+YfnLRlVbtNom/VjTsZUVxvXMuFe4/+jJRPhw1AZtSXdWV4TFYM2eNS9\nKJmVCTJzAgMBAAECggEAEFIrAtVuw6PYTLeEEU7IbVz2EyJ5ku3nFlu9MADLvgBG\nL6/EaadzluUrQUDuowEtQMdQY/qZ/HlnsGSIgV9SEPyyv5yayyb2ymIbnF5GR0Z6\nRHyyaCtIY83SFGd5aamWNX587OrGSGV1FdPmxc+D8qQjTeHGx3Dbzf43Rb4diEnt\nDYvLzT99sXhQPQch9GoL++z6lNxSqdbbXuKGRlHlzpfZUdt2YG1rpDvTNkhy+8XI\neDPyXP+ptiN5uKTH2abxou7Fs3eG98bxRxhPcPrCUiEFERcsZJk0tXy3KTqByLhf\n4mmw81XlRP9Dg2aWnXN2AGfynVIi5/D7mxCOScZrIQKBgQDS/34PA9HjIbkW3npd\nMfbdfo2SbcV+VZr2Xk9Lobp4nnI8uejTrCQ5u1ReXEeBw7OFmIn13M1r9wVvwnli\nW8hUoGhaUpaKJ+mk+QEzsuH3L4CQ+UNe57r+4KoCiUSrgppDP9aBWMdzrEf5Eqrr\nQ1bs46L8htuOq5SlIX6/YvfcOQKBgQDFpfqa+6j5xJgUT6/vcLUiZvXqeH1qa0d3\nDw4nKhWKOqMc5v9NVxMA7LsB2QXxfDpvizhc4Uzur5wCR1wQQtd4sSMQcUNLnbjE\n71e7sOpl54sqJ/8xMnSKHQ96ERrAoSbLOfXcC8VYJwhwttcgSyziWQC7VA2nu1HX\nBhiu+7CcCwKBgCBFw9o4E1pSRiUhUkX+5mtqd+z1rUdtgI4+TpKa4hKg6YgwR1RY\n+BF8faMRKj7G2CaO9ksMwr7IwaQecsKAl1uaTVvDVhM7l5kMHQrzSWytb1S9S3iw\nqQFjC53nsQEqsL2off66vYcLytZl7I6fdiQ1jTBi0CI6TDoVrXVIhfDBAoGATqvA\nUow1OCW+euc1GlN8ZdMhs1B+ayuEaKl/cqtXo4uvfUOc/0XXdJjF3vhpWzOdduSt\nbJrpKmCP8oBA7uAMMCgh0tuic6i18P1rqHPE+Qbu57q/4u84X/ktPeMtCNucO2w4\npnuw82OmAmdkvZ/un7HZjrboMIlpC/OLQ6s/Iv0CgYA9psf3Kvbqo5vRba7ST8hL\nB9hQGThmKACi9VQbLcWha+RChX7Rh6+PxH6k9g8ZTC+qry6z7P9qdHEjToNFe7v/\n5DE3ItpL0JGwvbXTjs6d+J/8m2acasmKmqV8XrQ9EBBm8tXKdy2uAr4kCUbrNtAH\nGecRlGiS+29YyyRA+2YibA==\n-----END PRIVATE KEY-----\n";

const serviceAccount = {
  "project_id": "roosevelt-491004",
  "private_key": privateKey,
  "client_email": "firebase-adminsdk-fbsvc@roosevelt-491004.iam.gserviceaccount.com"
};

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'roosevelt-491004'
});

const db = getFirestore(app);

const userId = 'PfwSF6yPmee21HGeuLsiX4JmErI3';
const entityId = 'personal-entity';

async function migrate() {
    console.log(`🚀 Iniciando Inyección Masiva para: ${userId}`);

    try {
        // 1. Crear documento de Entidad
        const entityRef = db.collection('users').doc(userId).collection('entities').doc(entityId);
        await entityRef.set({
            name: 'Roosevelt Business',
            role: 'owner',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        console.log('✅ Entidad Personal Creada');

        // 2. Inyectar Bots Originales (Con el nuevo formato de 20 dígitos)
        const bots = [
            {
                id: '20263456789012345678', // Formato numérico 20-digit
                name: 'Ventas - Roosevelt AI',
                description: 'Cierre de ventas automático y agendamiento de citas.',
                systemPrompt: 'Eres un experto cerrador de ventas para Roosevelt. Tu objetivo es calificar al cliente, responder dudas sobre precios y servicios, y finalmente agendar una cita. Siempre sé amable, profesional y enfocado al cierre.',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                status: 'active',
                type: 'whatsapp'
            },
            {
                id: '20263456789012345679',
                name: 'Soporte Técnico',
                description: 'Resolución de dudas y ayuda al cliente.',
                systemPrompt: 'Eres el asistente de soporte técnico de Roosevelt. Ayuda a los usuarios a configurar su plataforma, resolver errores y navegar por las herramientas comerciales.',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                status: 'active',
                type: 'whatsapp'
            },
            {
                id: '20263456789012345680',
                name: 'Bienvenida & Lead Gen',
                description: 'Filtro inicial de clientes potenciales.',
                systemPrompt: 'Eres el bot de recepción de Roosevelt. Da la bienvenida, pide el nombre del cliente y su interés principal para derivarlo al bot de Ventas o Soporte.',
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                status: 'active',
                type: 'whatsapp'
            }
        ];

        for (const bot of bots) {
            const { id, ...data } = bot;
            await entityRef.collection('chatbots').doc(id).set(data);
            console.log(`🤖 Bot Inyectado: ${bot.name}`);
        }

        // 3. Inyectar Proyectos Web (Basado en tu imagen)
        const webProjectRef = entityRef.collection('web-projects').doc('y5DGoPBDf6V7...'); // ID de la imagen
        await webProjectRef.set({
            name: 'Legacy Website',
            domain: 'roosevelt-preview.web.app',
            status: 'deployed',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
        console.log('🌐 Proyecto Web Inyectado');

        // 4. Inyectar contactos de prueba (CRM)
        await entityRef.collection('contacts').add({
            name: 'Cliente Prueba 1',
            email: 'test@example.com',
            phone: '+593900000000',
            stage: 'Lead',
            source: 'Bot de Bienvenida',
            createdAt: FieldValue.serverTimestamp()
        });
        console.log('👥 Contacto de prueba añadido al CRM');

        console.log('\n✨ INYECCIÓN COMPLETADA ✨');
        console.log(`El usuario udreamms@gmail.com ya tiene toda su información en la nueva consola de Roosevelt.`);

    } catch (e) {
        console.error('❌ Error en inyección:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
