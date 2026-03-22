
import React, { useState } from "react";
import { Rocket, Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { DeploymentStatus } from "../types";

interface DeployButtonProps {
    projectId: string | null;
    repoUrl?: string;
    projectName?: string;
    onDeployComplete: (url: string) => void;
}

export const DeployButton = ({
    projectId,
    repoUrl,
    projectName,
    onDeployComplete
}: DeployButtonProps) => {
    const [deployStatus, setDeployStatus] = useState<DeploymentStatus>({
        status: 'idle'
    });

    const handleDeploy = async () => {
        if (!projectId || !repoUrl) {
            setDeployStatus({
                status: 'error',
                message: 'Please link a GitHub repository first'
            });
            return;
        }

        setDeployStatus({ status: 'deploying', message: 'Deploying to Vercel...' });

        try {
            const response = await fetch('/api/web-builder/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    repoUrl,
                    projectName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Deployment failed');
            }

            setDeployStatus({
                status: 'success',
                url: data.url,
                message: 'Deployed successfully!',
                lastDeployed: Date.now()
            });

            onDeployComplete(data.url);

            // Reset to idle after 5 seconds
            setTimeout(() => {
                setDeployStatus({ status: 'idle' });
            }, 5000);

        } catch (error: any) {
            setDeployStatus({
                status: 'error',
                message: error.message || 'Deployment failed'
            });

            // Reset to idle after 5 seconds
            setTimeout(() => {
                setDeployStatus({ status: 'idle' });
            }, 5000);
        }
    };

    const isDisabled = !projectId || !repoUrl || deployStatus.status === 'deploying';

    return (
        <div className="relative">
            <button
                onClick={handleDeploy}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${deployStatus.status === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : deployStatus.status === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : deployStatus.status === 'deploying'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : isDisabled
                                    ? 'bg-[#1a1a1a] text-gray-600 border border-[#333] cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                    }`}
                title={!repoUrl ? 'Link a repository first' : 'Deploy to Vercel'}
            >
                {deployStatus.status === 'deploying' ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deploying...
                    </>
                ) : deployStatus.status === 'success' ? (
                    <>
                        <Check className="w-4 h-4" />
                        Deployed
                    </>
                ) : deployStatus.status === 'error' ? (
                    <>
                        <AlertCircle className="w-4 h-4" />
                        Failed
                    </>
                ) : (
                    <>
                        <Rocket className="w-4 h-4" />
                        Deploy
                    </>
                )}
            </button>

            {deployStatus.status === 'success' && deployStatus.url && (
                <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-[#1a1a1a] border border-green-500/30 rounded-lg text-xs shadow-lg z-10 min-w-[200px]">
                    <p className="text-green-400 font-medium mb-1">Deployment successful!</p>
                    <a
                        href={deployStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                        View live site
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}

            {deployStatus.message && deployStatus.status === 'error' && (
                <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-[#1a1a1a] border border-red-500/30 rounded-lg text-xs text-red-300 whitespace-nowrap shadow-lg z-10 max-w-xs">
                    {deployStatus.message}
                </div>
            )}
        </div>
    );
};

