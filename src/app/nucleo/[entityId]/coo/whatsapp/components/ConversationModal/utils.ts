import { Message } from './types';

export const groupMessagesByDate = (messages: Message[] = []) => {
    if (!Array.isArray(messages)) return {};

    const getMs = (ts: any) => {
        if (!ts) return 0;
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (ts.seconds) return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'string') return new Date(ts).getTime();
        if (typeof ts === 'number') return ts.toString().length === 10 ? ts * 1000 : ts;
        return 0;
    };

    // 1. Sort messages chronologically
    const sorted = [...messages].sort((a, b) => getMs(a.timestamp) - getMs(b.timestamp));

    // 2. Deduplicate: prefer Firestore messages (no .id) over optimistic ones (have .id)
    //    If both exist with same sender+text AND timestamp within 5 seconds, it's a duplicate.
    const deduped: Message[] = [];
    const recentMessages = new Set<string>();

    for (const msg of sorted) {
        const isOptimistic = !!(msg as any).id;
        const msgTime = getMs(msg.timestamp);

        // Deduplication key: Sender + Text + Approx Time (rounded to 5 seconds)
        const timeBucket = Math.floor(msgTime / 5000);
        const dupKey = `${msg.sender}:${msg.text}:${timeBucket}`;

        if (isOptimistic) {
            deduped.push(msg);
        } else {
            // Check if we need to replace an optimistic version
            const optIdx = deduped.findIndex(m => !!(m as any).id && m.text === msg.text && m.sender === msg.sender && Math.abs(getMs(m.timestamp) - msgTime) < 10000);

            if (optIdx !== -1) {
                deduped[optIdx] = msg; // Replace optimistic with Firestore version
            } else if (!recentMessages.has(dupKey)) {
                // Not an optimistic replacement, just a normal confirmed message
                deduped.push(msg);
                recentMessages.add(dupKey);
            }
        }
    }

    // 3. Group by Date (handle both Firestore Timestamp and epoch formats)
    return deduped.reduce((acc, msg) => {
        const ms = getMs(msg.timestamp);
        if (ms === 0) return acc;
        const ts = new Date(ms);
        const date = ts.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {} as { [key: string]: Message[] });
};
