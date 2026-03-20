import { CardData } from '../../types';
export type { CardData };
import { Timestamp } from 'firebase/firestore';

export interface ProfileTabProps {
    liveCardData: CardData | null;
    contactInfo: Partial<CardData>;
    isEditing: boolean;
    handleInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleInfoSave: () => Promise<void>;
    setIsEditing: (val: boolean) => void;
    setContactInfo: React.Dispatch<React.SetStateAction<Partial<CardData>>>;
    currentGroupName: string;
    toggleChecklistItem: (item: string) => Promise<void>;
    handleToggleCheckIn: (checkIn: any) => Promise<void>;
    checklistProgress: number;
    crmId: string | null | undefined;
}

export interface CustomPropertyMeta {
    __type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'phone' | 'email' | 'url' | 'checkbox' | 'status' | 'files' | 'people' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by' | 'button' | 'location' | 'id' | 'drive' | 'figma' | 'github' | 'zendesk';
    value: any;
    iconName?: string;
    visibility?: 'always' | 'hide-empty' | 'hidden';
}

export interface FieldConfig {
    key: string;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    section?: string;
}

export interface NotionType {
    id: string;
    label: string;
    icon: React.ReactNode;
    category?: string;
}
