import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json()); // Necesario para parsear el body POST

const activeSessions: { [entityId: string]: { sock: any, userId: string, type: string } } = {};
const sessionStatus: { [entityId: string]: string } = {};
const latestQRs: { [entityId: string]: string | null } = {};

const logger = pino({ level: 'silent' });

app.post('/api/internal/start-session', async (req, res) => {
    const { userId, entityId, type } = req.body;
    if (!userId || !entityId) {
        res.status(400).json({ error: 'Falta contexto del Molde Maestro (userId o entityId)' });
        return;
    }
    
    console.log(`[🚀] Solicitud REST para iniciar motor WhatsApp [${type}] - Entidad: ${entityId} - Dueño: ${userId}`);
    if (!activeSessions[entityId]) {
        sessionStatus[entityId] = 'GENERATING';
        startWhatsAppEngine(entityId, userId, type || 'personal');
    }
    res.json({ success: true, status: sessionStatus[entityId] });
});

app.get('/api/internal/qr/:entityId', (req, res) => {
    const entityId = req.params.entityId;
    res.json({
        qr: latestQRs[entityId] || null,
        status: sessionStatus[entityId] || 'IDLE'
    });
});

async function startWhatsAppEngine(entityId: string, userId: string, type: string) {
    const sessionDir = path.join(__dirname, '../sessions', entityId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Mac OS', 'Chrome', '121.0.0.0']
    });

    activeSessions[entityId] = { sock, userId, type };

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(`[QR] Generado vía REST para Entidad ${entityId} (${type})`);
            latestQRs[entityId] = qr;
            sessionStatus[entityId] = 'READY';
        }

        if (connection === 'open') {
            const phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || 'Unknown';
            console.log(`[✅] Entidad ${entityId} (Dueño: ${userId}) con número ${phoneNumber} conectada a WhatsApp ${type} con éxito.`);
            sessionStatus[entityId] = 'CONNECTED';
            latestQRs[entityId] = null;

            // [NOTIFICACIÓN DE CONEXIÓN]: Avisar a Roosevelt que el Molde está vinculado
            try {
                const webhookUrl = 'http://127.0.0.1:5001/roosevelt-491004/us-central1/baileysWebhook';
                axios.post(webhookUrl, {
                    userId,
                    entityId,
                    type,
                    phoneNumber,
                    event: 'connection_open'
                }).catch(e => console.error('[❌] Error avisando de conexión abierta:', e.message));
            } catch (e) {}
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[❌] Conexión cerrada para ${entityId}. Razón: ${(lastDisconnect?.error as any)?.message}`);
            
            // Wait 2 seconds before violently reconnecting to avoid infinite loops locking the CPU
            if (shouldReconnect) {
                setTimeout(() => startWhatsAppEngine(entityId, userId, type), 2000);
            } else {
                try {
                    // Notificar a Roosevelt que se cerró la sesión
                    const webhookUrl = 'http://127.0.0.1:5001/roosevelt-491004/us-central1/baileysWebhook';
                    axios.post(webhookUrl, {
                        userId,
                        entityId,
                        type,
                        event: 'connection_closed'
                    }).catch(() => {});

                    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) {}
                } catch (e) {}
                
                delete activeSessions[entityId];
                sessionStatus[entityId] = 'IDLE';
                latestQRs[entityId] = null;
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // [OÍDOS ACTIVADOS]: Escuchar mensajes entrantes y enviarlos al Omnicanal
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (msg.key.fromMe) continue; // Ignorar mis propios mensajes

            const text = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption || 
                         "";
            
            const from = msg.key.remoteJid?.split('@')[0] || '';
            const contactName = msg.pushName || 'Contacto WhatsApp';
            
            if (!text && !msg.message?.imageMessage) continue;

            console.log(`[📩] Mensaje recibido de ${from}: ${text.substring(0, 30)}...`);

            // Determinar tipo
            let type = 'text';
            if (msg.message?.imageMessage) type = 'image';
            if (msg.message?.videoMessage) type = 'video';
            if (msg.message?.audioMessage) type = 'audio';

            // Forward to Roosevelt Master Mold Webhook
            try {
                // Usamos la URL local para pruebas o la de producción si está configurada.
                const webhookUrl = 'http://127.0.0.1:5001/roosevelt-491004/us-central1/baileysWebhook';
                
                await axios.post(webhookUrl, {
                    userId: userId,
                    entityId: entityId,
                    message: {
                        from: from,
                        contactName: contactName,
                        text: text,
                        type: type,
                        timestamp: (msg.messageTimestamp as number) * 1000,
                        mediaUrl: null // Baileys requiere descarga manual de media
                    }
                });
            } catch (error: any) {
                console.error(`[❌] Error enviando mensaje al webhook: ${error.message}`);
            }
        }
    });
}

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`[🔥] Servidor REST Molde Maestro (WhatsApp API Node) volando en el puerto ${PORT}`);
});
