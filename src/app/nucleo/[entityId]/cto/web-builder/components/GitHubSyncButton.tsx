
import React, { useState } from "react";
import { GitBranch, Loader2, Check, AlertCircle, Upload } from "lucide-react";
import { SyncStatus } from "../types";

interface GitHubSyncButtonProps {
    projectId: string | null;
    repoUrl?: string;
    files: Record<string, string>;
    onSyncComplete: () => void;
}

export const GitHubSyncButton = ({
    projectId,
    repoUrl,
    files,
    onSyncComplete
}: GitHubSyncButtonProps) => {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        status: 'idle'
    });

    const handleSync = async () => {
        if (!projectId || !repoUrl) return;

        setSyncStatus({ status: 'syncing', message: 'Syncing to GitHub...' });

        try {
            const response = await fetch('/api/web-builder/git', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'sync',
                    repoUrl,
                    message: `Update from Web Builder - ${new Date().toLocaleString()}`,
                    files
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Sync failed');
            }

            if (data.status === 'no_changes') {
                setSyncStatus({
                    status: 'success',
                    message: 'No changes to sync',
                    lastSync: Date.now()
                });
            } else {
                setSyncStatus({
                    status: 'success',
                    message: 'Synced successfully',
                    lastSync: Date.now()
                });
                onSyncComplete();
            }

            // Reset to idle after 3 seconds
            setTimeout(() => {
                setSyncStatus({ status: 'idle' });
            }, 3000);

        } catch (error: any) {
            setSyncStatus({
                status: 'error',
                message: error.message || 'Sync failed'
            });

            // Reset to idle after 5 seconds
            setTimeout(() => {
                setSyncStatus({ status: 'idle' });
            }, 5000);
        }
    };

    const isDisabled = !projectId || !repoUrl || syncStatus.status === 'syncing';

    return (
        <div className="relative">
            <button
                onClick={handleSync}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${syncStatus.status === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : syncStatus.status === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : syncStatus.status === 'syncing'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : isDisabled
                                    ? 'bg-[#1a1a1a] text-gray-600 border border-[#333] cursor-not-allowed'
                                    : 'bg-[#1a1a1a] text-gray-300 border border-[#333] hover:border-[#444] hover:text-white'
                    }`}
                title={!repoUrl ? 'No repository linked' : 'Sync to GitHub'}
            >
                {syncStatus.status === 'syncing' ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                    </>
                ) : syncStatus.status === 'success' ? (
                    <>
                        <Check className="w-4 h-4" />
                        Synced
                    </>
                ) : syncStatus.status === 'error' ? (
                    <>
                        <AlertCircle className="w-4 h-4" />
                        Failed
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4" />
                        Sync to GitHub
                    </>
                )}
            </button>

            {syncStatus.message && syncStatus.status !== 'idle' && (
                <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-gray-300 whitespace-nowrap shadow-lg z-10">
                    {syncStatus.message}
                </div>
            )}
        </div>
    );
};

