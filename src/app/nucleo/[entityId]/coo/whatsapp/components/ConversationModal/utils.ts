import { Message } from './types';

export const groupMessagesByDate = (messages: Message[] = []) => {
    if (!Array.isArray(messages)) return {};
    
    // 1. Sort messages chronologically
    const sorted = [...messages].sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 
                     (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 
                     (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
        return timeA - timeB;
    });

    // 2. Group by Date
    return sorted.reduce((acc, msg) => {
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

