"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = resolveTenant;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
async function resolveTenant(platform, platformId) {
    const db = admin.firestore();
    let mappingPath = '';
    switch (platform) {
        case 'whatsapp':
            mappingPath = `system_mappings/whatsapp_numbers/numbers/${platformId}`;
            break;
        case 'messenger':
        case 'page':
            mappingPath = `system_mappings/meta_pages/pages/${platformId}`;
            break;
        case 'instagram':
            mappingPath = `system_mappings/instagram_accounts/accounts/${platformId}`;
            break;
        case 'telegram':
            mappingPath = `system_mappings/telegram_bots/bots/${platformId}`;
            break;
        case 'tiktok':
            mappingPath = `system_mappings/tiktok_accounts/accounts/${platformId}`;
            break;
        case 'webchat':
            // For webchat, we might pass the entityId directly in the request or use a mapping for the domain
            mappingPath = `system_mappings/webchat_configs/configs/${platformId}`;
            break;
        default:
            functions.logger.warn(`[TenantResolver] Unknown platform: ${platform}`);
            return null;
    }
    try {
        const snap = await db.doc(mappingPath).get();
        if (snap.exists) {
            return snap.data();
        }
        functions.logger.warn(`[TenantResolver] No mapping found for ${platform}:${platformId} at ${mappingPath}`);
        // --- FALLBACK FOR DEVELOPMENT / MIGRATION ---
        // If no mapping found, we might look for a default or return null
        // To avoid breaking the flow if mappings aren't set up yet, we could return a "roosevelt" default
        // if explicitly in dev mode, but "Agnosticismo Total" says no hardcoding.
        // So we return null and the webhook should handle it.
        return null;
    }
    catch (error) {
        functions.logger.error(`[TenantResolver] Error resolving tenant for ${platform}:${platformId}`, error.message);
        return null;
    }
}
//# sourceMappingURL=tenantResolver.js.map