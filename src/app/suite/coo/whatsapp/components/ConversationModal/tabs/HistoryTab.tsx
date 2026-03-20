import React from 'react';

interface HistoryTabProps {
    liveCardData: any;
    newHistoryComment: string;
    setNewHistoryComment: (val: string) => void;
    handleSaveHistoryComment: () => Promise<any>;
}

export const HistoryTab: React.FC<HistoryTabProps> = () => {
    return (
        <div className="p-6 text-neutral-400 text-sm italic">
            Componente de Historial (Temporalmente no disponible)
        </div>
    );
};
