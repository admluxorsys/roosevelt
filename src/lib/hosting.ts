import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

/**
 * Utility class to interact with Firebase Hosting REST API programmatically.
 */
export class FirebaseHostingService {
    private projectId: string;
    private auth: GoogleAuth;

    constructor() {
        this.projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string;

        // Load credentials from environment variable
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountEnv) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
        }

        const credentials = JSON.parse(serviceAccountEnv);
        this.auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
        });
    }

    private async getAccessToken(): Promise<string> {
        const client = await this.auth.getClient();
        const token = await client.getAccessToken();
        if (!token.token) throw new Error('Failed to get access token');
        return token.token;
    }

    /**
     * Creates a new Hosting site.
     * @param siteId The unique ID for the new site.
     */
    async createSite(siteId: string) {
        const token = await this.getAccessToken();
        try {
            const response = await axios.post(
                `https://firebasehosting.googleapis.com/v1beta1/projects/${this.projectId}/sites?siteId=${siteId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data;
        } catch (error: any) {
            // If site already exists, we might want to continue or throw
            if (error.response?.status === 409) {
                console.log(`Site ${siteId} already exists, skipping creation.`);
                return { name: `projects/${this.projectId}/sites/${siteId}` };
            }
            throw error;
        }
    }

    /**
     * Deploys a set of files to a specific Hosting site.
     * @param siteId The ID of the site to deploy to.
     * @param files A mapping of filename to string content.
     */
    async deployFiles(siteId: string, files: Record<string, string>) {
        const token = await this.getAccessToken();
        const siteName = `projects/${this.projectId}/sites/${siteId}`;

        // 1. Create a new version
        const versionResponse = await axios.post(
            `https://firebasehosting.googleapis.com/v1beta1/${siteName}/versions`,
            {
                config: {
                    rewrites: [{ glob: '**', history: { canvas: 'index.html' } }] // Basic SPA-like rewrite if needed
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const versionName = versionResponse.data.name;

        // 2. Prepare files and hashes
        const fileHashes: Record<string, string> = {};
        const fileContents: Record<string, Buffer> = {};

        for (const [path, content] of Object.entries(files)) {
            const buffer = Buffer.from(content, 'utf-8');
            const hash = crypto.createHash('sha256').update(buffer).digest('hex');
            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            fileHashes[normalizedPath] = hash;
            fileContents[hash] = buffer;
        }

        // 3. Populate files (tell Firebase which hashes we want to upload)
        const populateResponse = await axios.post(
            `https://firebasehosting.googleapis.com/v1beta1/${versionName}:populateFiles`,
            { files: fileHashes },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const { uploadUrl, requiredHashes } = populateResponse.data;

        // 4. Upload required files
        if (requiredHashes && requiredHashes.length > 0) {
            for (const hash of requiredHashes) {
                const content = fileContents[hash];
                await axios.post(`${uploadUrl}/${hash}`, content, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/octet-stream'
                    }
                });
            }
        }

        // 5. Finalize the version
        await axios.patch(
            `https://firebasehosting.googleapis.com/v1beta1/${versionName}?updateMask=status`,
            { status: 'FINALIZED' },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        // 6. Create a release
        const releaseResponse = await axios.post(
            `https://firebasehosting.googleapis.com/v1beta1/${siteName}/releases?versionName=${versionName}`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        return {
            version: versionName,
            release: releaseResponse.data.name,
            url: `https://${siteId}.web.app`
        };
    }
}
