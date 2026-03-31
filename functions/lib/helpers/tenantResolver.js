"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = resolveTenant;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
/**
 * TENANT RESOLVER (Robust & Master Mold Compliant)
 * Maps platform-specific identifiers to { userId, entityId }
 *
 * Strategy:
 * 1. Search in modern 'integrations' vault (Collection Group).
 * 2. Fallback to legacy 'system_mappings' if index not ready or not found.
 */
async function resolveTenant(platform, platformId, secondaryId) {
    const db = admin.firestore();
    const fieldName = platform === 'whatsapp' ? 'phoneNumberId' : 'id';
    // 1. MODERN VAULT SEARCH (Preferred)
    try {
        let integrationsSnap = await db.collectionGroup("integrations")
            .where(fieldName, "==", platformId)
            .limit(1)
            .get();
        if (integrationsSnap.empty && !isNaN(Number(platformId))) {
            integrationsSnap = await db.collectionGroup("integrations")
                .where(fieldName, "==", Number(platformId))
                .limit(1)
                .get();
        }
        // Secondary search (WABA ID)
        if (integrationsSnap.empty && platform === 'whatsapp' && secondaryId) {
            integrationsSnap = await db.collectionGroup("integrations")
                .where("wabaId", "==", secondaryId)
                .limit(1)
                .get();
        }
        if (!integrationsSnap.empty) {
            const pathParts = integrationsSnap.docs[0].ref.path.split('/');
            const userId = pathParts[1];
            const entityId = pathParts[3];
            if (userId && entityId) {
                functions.logger.info(`[Tenant Resolver] ✅ Resolved via Vault: ${userId}/${entityId}`);
                return { userId, entityId };
            }
        }
    }
    catch (error) {
        functions.logger.warn(`[Tenant Resolver] ⚠️ Vault query skipped (index building?): ${error.message}`);
    }
    // 2. LEGACY FALLBACK (Reliable Last Resort)
    try {
        const mappingPath = `system_mappings/${platform === 'whatsapp' ? 'whatsapp_numbers' : platform + '_mappings'}/numbers/${platformId}`;
        const legacySnap = await db.doc(mappingPath).get();
        if (legacySnap.exists) {
            const data = legacySnap.data();
            if (data.userId && data.entityId) {
                functions.logger.info(`[Tenant Resolver] ✅ Resolved via Legacy: ${data.userId}/${data.entityId}`);
                return { userId: data.userId, entityId: data.entityId };
            }
        }
    }
    catch (error) {
        functions.logger.error(`[Tenant Resolver] ❌ Critical failure in Legacy resolution:`, error.message);
    }
    functions.logger.warn(`[Tenant Resolver] ❌ Final: UNRESOLVED for ${platform}:${platformId}`);
    return null;
}
//# sourceMappingURL=tenantResolver.js.map