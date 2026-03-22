
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import util from 'util';
import os from 'os';
import { db } from '@/lib/firebase-admin';

const execAsync = util.promisify(exec);

function logToFile(msg: string) {
    try {
        const logPath = path.join(process.cwd(), 'git-route.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`, 'utf8');
    } catch (e) {
        console.error('Logging failed', e);
    }
}


// Helper to write project files to disk
async function filesToDisk(files: Record<string, string>, diskPath: string) {
    for (const [filePath, content] of Object.entries(files)) {
        if (content === "__ASSET_ON_DISK__") {
            logToFile(`[Git API] Skipping physical write for existing asset: ${filePath}`);
            continue;
        }
        const absolutePath = path.join(diskPath, filePath);
        const dir = path.dirname(absolutePath);
        await fsPromises.mkdir(dir, { recursive: true });
        await fsPromises.writeFile(absolutePath, content);
    }
}

// Fallback Firestore fetch (might fail if no credentials)
async function syncFirestoreToDisk(projectId: string, diskPath: string) {
    try {
        const filesSnapshot = await db.collection('web-projects').doc(projectId).collection('files').get();
        const files: Record<string, string> = {};
        filesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.path && data.content !== undefined) {
                files[data.path] = data.content;
            }
        });
        await filesToDisk(files, diskPath);
    } catch (e) {
        console.warn("[Git API] Firestore Admin fetch failed. Make sure to provide files in the request.", e);
        throw new Error("Could not fetch files from database and none were provided.");
    }
}

export async function POST(req: Request) {
    let tmpPath = '';
    try {
        const { projectId, action, repoUrl, message, files, autoCreate, projectName } = await req.json();
        logToFile(`[Git API] Action: ${action}, Project: ${projectId}, Repo: ${repoUrl || 'Fetch from DB'}, Files provided: ${files ? Object.keys(files).length : 0}`);

        if (!projectId || !action) {
            return NextResponse.json({ error: 'Missing projectId or action' }, { status: 400 });
        }

        // Create a unique temporary directory for this operation
        const systemTmp = os.tmpdir();
        tmpPath = await fsPromises.mkdtemp(path.join(systemTmp, `web-builder-${projectId}-`));
        logToFile(`[Git API] Created tmpPath: ${tmpPath}`);

        // Get GitHub token from cookie
        const cookieStore = await cookies();
        const githubToken = cookieStore.get('github_token')?.value;
        logToFile(`[Git API] GitHub token found: ${!!githubToken}`);

        // Project Isolation: Always fetch from DB to ensure we target the correct repository for THIS projectId
        let dbRepoUrl = '';
        let dbRepoName = '';

        try {
            logToFile(`[Git API] Fetching project details for isolation: ${projectId}`);
            const projectDoc = await db.collection('web-projects').doc(projectId).get();
            if (projectDoc.exists) {
                dbRepoUrl = projectDoc.data()?.repoUrl || '';
                dbRepoName = projectDoc.data()?.repoName || '';
                logToFile(`[Git API] DB Repo linked: ${dbRepoUrl}`);
            } else {
                logToFile(`[Git API] No project document found for id: ${projectId}`);
            }
        } catch (e: any) {
            logToFile(`[Git API] Firestore Admin fetch failed (isolation check): ${e.message}`);
            // If DB fetch fails, we might be in a restricted environment. 
            // We'll proceed with extreme caution if repoUrl was provided.
        }

        let effectiveRepoUrl = dbRepoUrl || repoUrl;
        let effectiveRepoName = dbRepoName || '';

        if (repoUrl && dbRepoUrl && repoUrl !== dbRepoUrl) {
            logToFile(`[Git API] WARNING: Client provided repoUrl (${repoUrl}) mismatches DB (${dbRepoUrl}). Favoring DB.`);
            effectiveRepoUrl = dbRepoUrl;
        } else if (!dbRepoUrl && repoUrl) {
            logToFile(`[Git API] DB lookup failed or empty. Falling back to client-provided repoUrl: ${repoUrl}`);
            effectiveRepoUrl = repoUrl;
        }

        if (!effectiveRepoUrl) {
            logToFile(`[Git API] No repository linked for this project.`);
        }

        // --- AUTO-CREATE LOGIC ---
        if (autoCreate && !effectiveRepoUrl) {
            if (!githubToken) {
                return NextResponse.json({ error: 'GitHub account not connected. Please connect first.' }, { status: 401 });
            }

            const sanitizedName = (projectName || projectId).toLowerCase()
                .replace(/\s+/g, '-')           // Replace spaces with -
                .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric chars except -
                .replace(/--+/g, '-')           // Replace multiple - with single -
                .replace(/^-+/, '')             // Trim - from start
                .replace(/-+$/, '');            // Trim - from end

            console.log(`[Git API] Auto-creating repo: ${sanitizedName}`);

            const createRes = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: sanitizedName,
                    description: `Web Builder project: ${projectName || projectId}`,
                    private: true,
                    auto_init: true
                })
            });

            if (!createRes.ok) {
                const errorData = await createRes.json();
                // Check for 422 status (Unprocessable Entity) or specific message
                if (createRes.status === 422 || errorData.message?.includes('already exists')) {
                    console.log(`[Git API] Repo already exists, fetching existing info: ${sanitizedName}`);

                    // Fetch user info to get the namespace
                    const userRes = await fetch('https://api.github.com/user', {
                        headers: { 'Authorization': `Bearer ${githubToken}` }
                    });
                    const userData = await userRes.json();

                    // Construct and verify existing repo
                    const owner = userData.login;
                    effectiveRepoUrl = `https://github.com/${owner}/${sanitizedName}`;
                    effectiveRepoName = `${owner}/${sanitizedName}`;

                    console.log(`[Git API] Found existing repo: ${effectiveRepoName}`);
                } else {
                    throw new Error(`Failed to create repository: ${errorData.message || createRes.statusText}`);
                }
            } else {
                const repoData = await createRes.json();
                effectiveRepoUrl = repoData.html_url;
                effectiveRepoName = repoData.full_name;
            }

            // Update Firestore with the new repoUrl (Safe to ignore failure here)
            try {
                await db.collection('web-projects').doc(projectId).update({
                    repoUrl: effectiveRepoUrl,
                    repoName: effectiveRepoName || effectiveRepoUrl.split('/').slice(-2).join('/'),
                    githubConnected: true,
                    lastModified: Date.now()
                });
            } catch (e) {
                console.warn("[Git API] Firestore update failed, but proceeding with sync.");
            }
        }

        // Authenticate Repo URL if token is available
        if (githubToken && effectiveRepoUrl && effectiveRepoUrl.includes('github.com')) {
            // Transform https://github.com/user/repo -> https://x-access-token:TOKEN@github.com/user/repo
            effectiveRepoUrl = effectiveRepoUrl.replace('https://github.com/', `https://x-access-token:${githubToken}@github.com/`);
        }

        let result = '';

        switch (action) {
            case 'sync':
                if (!effectiveRepoUrl) {
                    return NextResponse.json({
                        status: 'no_repo',
                        message: 'No GitHub repository linked. Go to Settings to link one.'
                    });
                }

                // 1. Initialize Git in tmp path
                await execAsync('git init', { cwd: tmpPath });
                await execAsync('git config user.name "Web Builder"', { cwd: tmpPath });
                await execAsync('git config user.email "builder@udreamms.com"', { cwd: tmpPath });
                await execAsync('git branch -M main', { cwd: tmpPath });
                await execAsync(`git remote add origin ${effectiveRepoUrl}`, { cwd: tmpPath });

                // Try to fetch remote state to compare
                try {
                    logToFile(`[Git API] Fetching remote state...`);
                    await execAsync('git fetch origin main --depth=1', { cwd: tmpPath });
                    await execAsync('git reset --hard origin/main', { cwd: tmpPath });
                    logToFile(`[Git API] Remote state fetched and reset successfully.`);
                } catch (e: any) {
                    logToFile(`[Git API] Remote fetch failed (maybe empty repo): ${e.message}`);
                }

                // 2. Fetch/Prepare files
                const projectFiles = (files && Object.keys(files).length > 0) ? files : null;
                logToFile(`[Git API] Writing ${projectFiles ? Object.keys(projectFiles).length : '0'} builder files to disk...`);

                if (projectFiles) {
                    await filesToDisk(projectFiles, tmpPath);
                } else {
                    await syncFirestoreToDisk(projectId, tmpPath);
                }

                // 3. Git Operations
                await execAsync('git add .', { cwd: tmpPath });
                const statusAfterAdd = await execAsync('git status --short', { cwd: tmpPath });
                const statusMsg = `[Git API] Git Status: ${statusAfterAdd.stdout || 'Empty (No changes)'}`;
                logToFile(statusMsg);

                try {
                    const commitRes = await execAsync(`git commit -m "${message || 'Auto-sync from Web Builder'}"`, { cwd: tmpPath });
                    logToFile(`[Git API] Commit success: ${commitRes.stdout.substring(0, 50)}...`);
                } catch (e: any) {
                    logToFile(`[Git API] Commit check: ${e.stdout || e.message}`);
                    if (e.stdout?.includes('nothing to commit')) {
                        return NextResponse.json({
                            success: true,
                            status: 'no_changes',
                            message: 'No changes found to sync',
                            repoUrl: effectiveRepoUrl.replace(/https:\/\/x-access-token:.*@/, 'https://'),
                            repoName: effectiveRepoName
                        });
                    }
                    throw e;
                }

                // --- dryRun Check ---
                if (req.headers.get('x-dry-run') === 'true') {
                    return NextResponse.json({
                        success: true,
                        status: 'has_changes',
                        message: 'Changes detected but not pushed (dry run)',
                        repoUrl: effectiveRepoUrl.replace(/https:\/\/x-access-token:.*@/, 'https://'),
                        repoName: effectiveRepoName
                    });
                }

                // 4. Push
                try {
                    await execAsync('git push -f origin main', { cwd: tmpPath });
                    result = 'Synced successfully to GitHub (Force pushed)';
                } catch (e: any) {
                    console.error("Push failed:", e);
                    throw new Error(`Push failed: ${e.message}`);
                }
                break;

            case 'check':
                if (!effectiveRepoUrl) {
                    return NextResponse.json({ error: 'No repository URL linked' }, { status: 400 });
                }
                try {
                    await execAsync(`git ls-remote ${effectiveRepoUrl}`);
                    result = 'Connection verified';
                } catch (e: any) {
                    throw new Error(`Connection failed: ${e.message}`);
                }
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: result,
            repoUrl: effectiveRepoUrl.replace(/https:\/\/x-access-token:.*@/, 'https://'),
            repoName: effectiveRepoName
        });

    } catch (error: any) {
        console.error("Git operation failed:", error);
        return NextResponse.json({ error: error.message || 'Git operation failed' }, { status: 500 });
    } finally {
        // CLEANUP
        if (tmpPath) {
            try {
                await fsPromises.rm(tmpPath, { recursive: true, force: true });
            } catch (e) {
                console.warn(`[Git API] Failed to cleanup tmp directory: ${tmpPath}`, e);
            }
        }
    }
}

