import * as admin from 'firebase-admin';

// Initialize firebase admin with default credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testBot() {
  const userId = 'g02IGViHitZjPKlOuCG7j5J3uK33';
  const entityId = 'roosevelt';
  
  console.log(`Testing getActiveBot for ${userId}/${entityId}`);
  
  const botsSnapshot = await db.collection(`users/${userId}/entities/${entityId}/chatbots`)
        .where('isActive', '==', true)
        .get();

  if (botsSnapshot.empty) {
      console.log('TEST_RESULT: No active bots found! This is why it is skipping.');
      return;
  }
  
  console.log(`Found ${botsSnapshot.size} active bots.`);
  
  const bots = botsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
  bots.sort((a, b) => {
      const timeA = a.updatedAt?.toDate?.()?.getTime() || a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.updatedAt?.toDate?.()?.getTime() || b.createdAt?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
  });

  const botData = bots[0];
  console.log('Selected Bot:', botData.id, botData.name);
  
  if (!botData.flow) {
      console.log('TEST_RESULT: Missing flow.');
      return;
  }
  if (!botData.flow.nodes) console.log('TEST_RESULT: Missing nodes.');
  if (!botData.flow.edges) console.log('TEST_RESULT: Missing edges.');
  
  if (botData.flow.nodes && botData.flow.edges) {
      console.log('TEST_RESULT: Bot is strictly valid!');
      console.log('Nodes count:', botData.flow.nodes.length);
      console.log('Edges count:', botData.flow.edges.length);
  }
}

testBot().catch(console.error).finally(() => process.exit(0));
