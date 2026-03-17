import { Message } from './types';

export const groupMessagesByDate = (messages: Message[] = []) => {
    if (!Array.isArray(messages)) return {};
    return messages.reduce((acc, msg) => {
        if (!msg.timestamp?.toDate) return acc;
        const date = msg.timestamp.toDate().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {} as { [key: string]: Message[] });
};
