const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /counters/{counterId} {
      allow read, write: if request.auth != null;
    }

    match /kanban-groups/{groupId} {
      allow read, write: if request.auth != null;
      match /cards/{cardId} {
        allow read, write: if request.auth != null;
      }
    }

    match /cards/{cardId} {
      allow read, write: if true;
    }

    match /chatbots/{chatbotId} {
      allow read, write: if true;
      match /pages/{pageId} {
        allow read, write: if true;
      }
    }

    match /web-projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /contacts/{contactId} {
      allow read, write: if request.auth != null;
      allow read: if true;
    }

    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

const { GoogleAuth } = require('google-auth-library');
const https = require('https');

async function deployRules() {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const projectId = serviceAccount.project_id;

  const body = JSON.stringify({
    source: {
      files: [{ name: 'firestore.rules', content: rules }]
    }
  });

  // Create ruleset
  const rulesetData = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body
    }
  );
  
  const ruleset = await rulesetData.json();
  console.log('Ruleset created:', ruleset.name);

  // Update release
  const releaseRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ release: { name: `projects/${projectId}/releases/cloud.firestore`, rulesetName: ruleset.name } })
    }
  );
  
  const release = await releaseRes.json();
  console.log('✅ Rules deployed:', release.name);
  process.exit(0);
}

deployRules().catch(e => { console.error(e); process.exit(1); });
