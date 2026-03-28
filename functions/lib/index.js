"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCards = exports.moveCard = exports.baileysWebhook = exports.googleFormsWebhook = exports.tiktokWebhook = exports.webchatWebhook = exports.xWebhook = exports.telegramWebhook = exports.metaWebhook = exports.whatsappWebhook = void 0;
const admin = require("firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp();
}
var whatsapp_1 = require("./webhooks/whatsapp");
Object.defineProperty(exports, "whatsappWebhook", { enumerable: true, get: function () { return whatsapp_1.whatsappWebhook; } });
var meta_1 = require("./webhooks/meta");
Object.defineProperty(exports, "metaWebhook", { enumerable: true, get: function () { return meta_1.metaWebhook; } });
var telegram_1 = require("./webhooks/telegram");
Object.defineProperty(exports, "telegramWebhook", { enumerable: true, get: function () { return telegram_1.telegramWebhook; } });
var x_1 = require("./webhooks/x");
Object.defineProperty(exports, "xWebhook", { enumerable: true, get: function () { return x_1.xWebhook; } });
var webchat_1 = require("./webhooks/webchat");
Object.defineProperty(exports, "webchatWebhook", { enumerable: true, get: function () { return webchat_1.webchatWebhook; } });
var tiktok_1 = require("./webhooks/tiktok");
Object.defineProperty(exports, "tiktokWebhook", { enumerable: true, get: function () { return tiktok_1.tiktokWebhook; } });
var googleForms_1 = require("./webhooks/googleForms");
Object.defineProperty(exports, "googleFormsWebhook", { enumerable: true, get: function () { return googleForms_1.googleFormsWebhook; } });
var baileys_1 = require("./webhooks/baileys");
Object.defineProperty(exports, "baileysWebhook", { enumerable: true, get: function () { return baileys_1.baileysWebhook; } });
var kanbanOperations_1 = require("./helpers/kanbanOperations");
Object.defineProperty(exports, "moveCard", { enumerable: true, get: function () { return kanbanOperations_1.moveCard; } });
var migrateCards_1 = require("./helpers/migrateCards");
Object.defineProperty(exports, "migrateCards", { enumerable: true, get: function () { return migrateCards_1.migrateCards; } });
//# sourceMappingURL=index.js.map