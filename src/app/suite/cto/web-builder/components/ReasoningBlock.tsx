import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Sparkles, Loader2, Circle, CheckCircle2 } from 'lucide-react';
import { ChatStep } from '../types';

interface ReasoningBlockProps {
    content: string;
    steps?: ChatStep[];
    thinkingTime?: number;
    isGenerating?: boolean;
    msgId?: string;
    approved?: boolean;
}

export const ReasoningBlock = ({ content, steps = [], thinkingTime, isGenerating, msgId, approved }: ReasoningBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract content inside <think> tags
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const reasoningText = thinkMatch ? thinkMatch[1].trim() : "";

    if (!reasoningText && (!steps || steps.length === 0) && !isGenerating) return null;

    const laboralSteps = steps.filter(s => s.type === 'laboral' || !s.type);
    const proximoSteps = steps.filter(s => s.type === 'proximo');

    return (
        <div className="mb-2 w-full">
            {/* Thinking Time Header */}
            <div className="flex items-center gap-2 mb-1.5 px-1 text-gray-500">
                <span className="text-[10px] font-medium tracking-tight opacity-70">
                    {isGenerating ? "Pensándolo..." : `Pensamiento durante ${thinkingTime || 0}s`}
                </span>
            </div>

            {/* Reasoning details (Collapsible) can be added here if needed in the future */}
        </div>
    );
};
