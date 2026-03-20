
export interface MessagingAdapter {
    sendMessage(to: string, text: string, options?: { preview_url?: boolean }): Promise<any>;
    sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any>;
    sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[], header?: { type: string, text?: string, url?: string }): Promise<any>;
    sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any>;
    sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any>;
    markAsRead(messageId: string): Promise<any>;
}
