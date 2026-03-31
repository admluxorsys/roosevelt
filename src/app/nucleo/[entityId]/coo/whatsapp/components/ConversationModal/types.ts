import { Timestamp } from 'firebase/firestore';

export interface Message {
    text: string;
    sender: 'user' | 'agent';
    timestamp: Timestamp;
    fileUrl?: string;
    fileType?: string;
    fileName?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    type?: string;
    metadata?: any;
}

export interface CheckIn {
    id: string;
    text: string;
    author: string;
    timestamp: Timestamp;
    completed?: boolean;
}

export interface Note {
    id: string;
    text: string;
    author: string;
    timestamp: Timestamp;
    completed?: boolean;
}

export interface PaymentMethod {
    id: string;
    type: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'bank_transfer' | 'other';
    last4?: string;
    expiry?: string;
    brand?: string;
    isDefault?: boolean;
}

export interface Subscription {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    status: 'active' | 'past_due' | 'canceled';
    nextBillingDate: Timestamp;
}

export interface Transaction {
    id: string;
    amount: number;
    currency: string;
    date: Timestamp;
    status: 'completed' | 'pending' | 'failed';
    method: string;
    description: string;
}

export interface AttachedDocument {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Timestamp;
}

export interface HistoryEvent {
    id: string;
    type: 'message' | 'edit' | 'status' | 'comment' | 'file' | 'system';
    content: string;
    timestamp: Timestamp;
    author?: string;
}

export interface CardData {
    id: string;
    groupId: string;
    contactName?: string;
    contactNumber?: string;
    company?: string;
    email?: string;
    website?: string;
    address?: string;
    messages?: Message[];
    lastReadAt?: Timestamp;
    notes?: Note[];
    checkIns?: CheckIn[];
    paymentStatus?: string;
    checklistStatus?: { [key: string]: boolean };
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    birthDate?: any; // Can be Timestamp or string
    birthPlace?: string;
    birthCity?: string;
    birthState?: string;
    birthCountry?: string;
    nationalId?: string;
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
    spouseCity?: string;
    spouseState?: string;
    spouseCountry?: string;
    usAddress?: string;
    hasOtherNationality?: 'yes' | 'no';
    otherNationalityCountry?: string;
    isPermanentResidentOther?: 'yes' | 'no';
    permanentResidentCountry?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;

    // Travel & Visa
    clientType?: 'persona' | 'empresa' | 'estudiante';
    gender?: 'man' | 'woman' | 'other';
    passport?: string;
    passportNumber?: string;
    passportCountry?: string;
    passportCity?: string;
    passportState?: string;
    passportIssuedDate?: any; // Renamed from issueDate
    passportExpiryDate?: any;
    passportLost?: 'yes' | 'no';
    hasTouristVisa?: 'yes' | 'no';
    visaIssuedDate?: any;
    visaExpiryDate?: any;

    // Family
    spouseName?: string;
    spouseBirthDate?: any;
    marriageDate?: any;
    fatherName?: string;
    fatherBirthDate?: any;
    motherName?: string;
    motherBirthDate?: any;

    // Education
    schoolName?: string;
    schoolProgram?: string;
    universityName?: string;
    universityProgram?: string;

    // Employment
    occupation?: string;
    currentEmployer?: string;
    monthlySalary?: string;
    jobStartDate?: any;
    jobDescription?: string;

    // Background
    studyReason?: string;
    languages?: string;
    visaRefusal?: 'yes' | 'no';
    militaryService?: 'yes' | 'no';

    // Identity & More
    nationality?: string;
    primaryLanguage?: string;
    additionalLanguages?: string[];
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;

    // Preferences & Health
    allergies?: string;
    medicalConditions?: string;
    interests?: string;
    profession?: string;

    // Service
    serviceDetails?: string;
    serviceType?: string;
    backupLink?: string;
    contractLink?: string;
    invoiceLink?: string;
    socials?: { [key: string]: string };
    source?: string;
    documents?: AttachedDocument[];
    paymentMethods?: PaymentMethod[];
    transactions?: Transaction[];
    subscriptions?: Subscription[];
    history?: HistoryEvent[];
    visaType?: string;
    hasPassport?: 'yes' | 'no';
    channel?: string;
    primary_channel?: string;
    mutedUntil?: Timestamp | null;
    isBlocked?: boolean;
    extraData?: { [key: string]: any };
    propertyOrder?: string[];
    assignedTo?: string;
    labels?: string[];
    unreadCount?: number;
}

export interface ConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName?: string;
    groups?: any[];
    isGlobalContact?: boolean;
    allConversations?: any[];
    onSelectConversation?: (conv: any) => void;
    stats?: {
        totalConversations: number;
        totalGroups: number;
    };
    card: {
        id: string;
        groupId?: string;
        contactName?: string;
        contactNumber?: string;
        [key: string]: any;
    } | null;
    position?: DOMRect | null;
    hideInternalTray?: boolean;
    hideSidebar?: boolean;
    currentGroupName?: string;
}

