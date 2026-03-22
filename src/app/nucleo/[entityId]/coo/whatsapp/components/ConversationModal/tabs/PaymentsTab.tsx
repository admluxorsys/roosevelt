import React from 'react';

interface PaymentsTabProps {
    liveCardData: any;
    isAddingPayment: boolean;
    setIsAddingPayment: (val: boolean) => void;
    newPayment: any;
    setNewPayment: any;
    handleSavePaymentMethod: () => Promise<any>;
    serviceType: string;
    setServiceType: (type: string) => void;
    serviceDetails: string;
    setServiceDetails: (val: string) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = () => {
    return (
        <div className="p-6 text-neutral-400 text-sm italic">
            Componente de Pagos (Temporalmente no disponible)
        </div>
    );
};

