"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleFormsWebhook = void 0;
const functions = require("firebase-functions");
const kanbanOperations_1 = require("../helpers/kanbanOperations");
/**
 * Webhook para recibir datos de Google Forms.
 * Se espera un POST con: { name, phone, email, message }
 */
exports.googleFormsWebhook = functions.https.onRequest(async (req, res) => {
    // Manejo de CORS manual si es necesario (Firebase Functions lo suele requerir en onRequest)
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const { name, phone, email, message } = req.body;
    if (!phone) {
        res.status(400).send('Missing phone number');
        return;
    }
    try {
        const contactName = name || 'Nuevo Lead (Web)';
        const bodyContent = message || `Lead registrado vía Formulario. Email: ${email || 'N/A'}`;
        const unifiedMessage = {
            source_platform: 'form',
            external_id: phone,
            contact_name: contactName,
            message_text: bodyContent,
            message_type: 'text',
            timestamp: new Date(),
            platform_metadata: { email, original_name: name }
        };
        // Creamos la tarjeta con origen 'form' pero usando la lógica Omnicanal
        await (0, kanbanOperations_1.handleKanbanUpdateOmni)(unifiedMessage);
        functions.logger.info(`Lead created from Google Form (Omni): ${contactName} (${phone})`);
        res.status(200).send({ success: true, message: 'Lead imported correctly' });
    }
    catch (error) {
        functions.logger.error('Error in googleFormsWebhook:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
});
//# sourceMappingURL=googleForms.js.map