import { MessageCircle, Instagram, Facebook, Send, Youtube, Twitter, Globe2 } from 'lucide-react';
import { TikTokIcon } from './components/SharedComponents';

export const socialPlatforms = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { name: 'Messenger', icon: Facebook, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'TikTok', icon: TikTokIcon, color: 'text-white', bgColor: 'bg-neutral-800' },
    { name: 'Telegram', icon: Send, color: 'text-sky-400', bgColor: 'bg-sky-400/10' },
    { name: 'YouTube', icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { name: 'X', icon: Twitter, color: 'text-white', bgColor: 'bg-neutral-900 border border-neutral-800' },
    { name: 'Web', icon: Globe2, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
];
