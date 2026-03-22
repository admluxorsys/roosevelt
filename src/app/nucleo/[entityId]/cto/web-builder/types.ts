export type ReasoningLevel = "low" | "medium" | "high";
export type RepoStatus = "disconnected" | "connecting" | "connected";
export type ConversationState = 'idle' | 'awaiting_details';

export interface ChatStep {
    id: string;
    label: string;
    status: 'pending' | 'current' | 'done' | 'error';
    type?: 'laboral' | 'proximo';
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp?: number;
    plan?: {
        summary: string;
        structure: string[];
        features: string[];
        theme: string;
    };
    checklist?: { label: string; completed: boolean }[];
    steps?: ChatStep[];
    images?: string[];
    thinkingTime?: number;
    approved?: boolean;
    showCloudSetup?: boolean;
    supabaseConfig?: { url: string; key: string };
}

export interface PreviewAreaProps {
    generatedTheme: 'default' | 'art' | 'tech' | 'cosmetics';
    activeFile: string;
    setActiveFile: (path: string) => void;
    projectOpen: boolean;
    files?: Record<string, string>;
}

export interface WebProject {
    id: string;
    name: string;
    repoUrl?: string;
    repoName?: string;
    lastModified: number;
    previewUrl?: string;
    deploymentUrl?: string;
    lastDeployed?: number;
    lastSynced?: number;
    githubConnected?: boolean;
    githubOwner?: string;      // GitHub login (e.g. 'elizmey', 'skylertitu') — per project
    githubAvatar?: string;     // GitHub avatar_url — per project
    customUrl?: string;
    customDomain?: string;
    description?: string;
    visibility?: 'public' | 'private';
    // Database Integration (Supabase)
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    databaseMode?: 'none' | 'manual' | 'automatic';
}

export interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
    email?: string;
}

export interface GitHubRepo {
    name: string;
    full_name: string;
    html_url: string;
    private: boolean;
}

export interface SyncStatus {
    status: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
    lastSync?: number;
}

export interface DeploymentStatus {
    status: 'idle' | 'deploying' | 'success' | 'error';
    url?: string;
    message?: string;
    lastDeployed?: number;
}

export interface RepoItem {
    name: string;
    active: boolean;
}
export interface ChatConversation {
    id: string;
    title: string;
    lastMessage?: string;
    updatedAt: number;
}

