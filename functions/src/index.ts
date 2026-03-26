import * as admin from 'firebase-admin';
if (!admin.apps.length) {
    admin.initializeApp();
}

export { whatsappWebhook } from './webhooks/whatsapp';
export { metaWebhook } from './webhooks/meta';
export { telegramWebhook } from './webhooks/telegram';
export { xWebhook } from './webhooks/x';
export { webchatWebhook } from './webhooks/webchat';
export { tiktokWebhook } from './webhooks/tiktok';
export { googleFormsWebhook } from './webhooks/googleForms';
export { baileysWebhook } from "./webhooks/baileys";
export { moveCard } from './helpers/kanbanOperations';
export { migrateCards } from './helpers/migrateCards';
