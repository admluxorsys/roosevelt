'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, Variants, motion } from 'framer-motion';

import { db } from '@/lib/firebase';
import { collection, getDocs, collectionGroup, setDoc, doc, deleteDoc, serverTimestamp, query, where, updateDoc, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { Plus, Search, X, Users, RefreshCw, Filter, MoreHorizontal, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ConversationModal from '../../coo/kamban/components/ConversationModal';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { useRouter } from 'next/navigation';

// Modular Components
import { ContactHeader } from './components/ContactHeader';
import { ContactFilters } from './components/ContactFilters';
import { ContactList } from './components/ContactList';
import { ContactGrid } from './components/ContactGrid';
import { ContactDetailsModal } from './components/ContactDetailsModal';
import { ImportDialog } from './components/ImportDialog';
import { DuplicateManager } from './components/DuplicateManager';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const HEADER_MAPPING: { [key: string]: string[] } = {
    // --- Identity & Demographics ---
    name: ['name', 'nombre', 'fullname', 'nombre completo', 'full name', 'client', 'cliente'],
    email: ['email', 'correo', 'mail', 'digital mail', 'correo electrónico'],
    phone: ['phone', 'teléfono', 'telefono', 'tel', 'celular', 'mobile', 'kamban', 'direct line', 'contactnumber'],
    birthDate: ['birthdate', 'fecha de nacimiento', 'fecha nacimiento', 'nacimiento', 'cumpleaños', 'dob'],
    gender: ['gender', 'género', 'genero', 'sexo', 'sex', 'sexualidad'],
    maritalStatus: ['maritalstatus', 'estado civil', 'civil status', 'situación civil'],
    nationality: ['nationality', 'nacionalidad', 'pais de origen', 'país de origen', 'country of origin', 'citizen of'],
    birthPlace: ['birthplace', 'lugar de nacimiento', 'lugar nacimiento', 'city of birth', 'ciudad de nacimiento'],

    // --- Detailed Address ---
    city: ['city', 'ciudad', 'municipio'],
    state: ['state', 'provincia', 'estado', 'departamento', 'región'],
    country: ['country', 'país', 'pais', 'residence country'],
    address: ['address', 'dirección', 'direccion', 'calle', 'ubicación', 'geographic location', 'street', 'domicilio'],
    postalCode: ['postalcode', 'código postal', 'zip', 'zipcode', 'cp', 'postal code'],
    usAddress: ['usaddress', 'dirección en usa', 'direccion usa', 'hospedaje usa', 'host address', 'usa address'],

    // --- Education ---
    schoolName: ['schoolname', 'colegio', 'high school', 'escuela', 'institución secundaria', 'secundaria'],
    highSchoolProgram: ['highschoolprogram', 'programa secundaria', 'programa sec', 'bachillerato'],
    universityName: ['universityname', 'universidad', 'university'],
    profession: ['profession', 'profesión', 'profesion', 'carrera', 'carrera universitaria', 'degree', 'carrera uni'],

    // --- Study & Background Plans ---
    studyReason: ['studyreason', 'razón estudio', 'razon estudio', 'motivo de viaje', 'study purpose', '¿por qué estudiar?'],
    studyDuration: ['studyduration', 'tiempo estudio', 'duración', 'duration', 'tiempo de estudio'],
    startSemester: ['startsemester', 'semestre inicio', 'inicio clases', 'start date', 'intake', 'enero/mayo/sept'],
    preferredSchedule: ['preferredschedule', 'horario pref', 'horario preferido', 'horario', 'turno', 'mañana/tarde/noche'],
    destinationSchool: ['destinationschool', 'escuela destino', 'institución destino', 'colegio destino'],
    visaRejection: ['visarejection', 'rechazo visa', 'visa rechazada', 'negación de visa', 'has visa rejection?', 'rechazo anterior'],

    // --- Employment ---
    occupationData: ['occupationdata', 'situación laboral', 'employment status', 'estado laboral', 'tipo empleo'],
    currentEmployer: ['currentemployer', 'empresa actual', 'employer', 'current employer', 'empresa'],
    companyAddress: ['companyaddress', 'dirección empresa', 'direccion boss', 'dirección empleador'],
    companyCity: ['companycity', 'ciudad empresa', 'ciudad boss'],
    companyPhone: ['companyphone', 'teléfono empresa', 'tel boss', 'telefono empleador'],
    monthlySalary: ['monthlysalary', 'salario', 'sueldo', 'monthly salary', 'income', 'salario mensual', 'monto'],
    employmentStartDate: ['employmentstartdate', 'inicio empleo', 'fecha inicio', 'antigüedad', 'fecha contratación'],
    roleDescription: ['roledescription', 'descripción rol', 'descripción', 'job description', 'funciones'],
    otherIncome: ['otherincome', 'otros ingresos', 'fuentes extra', 'ingresos adicionales'],
    previousEmployment: ['previousemployment', 'empleo anterior?', '¿empleo anterior?', 'trabajo previo'],

    // --- Family & Sponsor ---
    hasSponsor: ['hassponsor', 'patrocinador', 'tiene sponsor', 'sponsor?', '¿tienes patrocinador?'],
    sponsorFirstName: ['sponsorname', 'nombre sponsor', 'nombre patrocinador', 'sponsor first name'],
    sponsorLastName: ['sponsorsurname', 'apellido sponsor', 'apellido patrocinador', 'sponsor last name'],
    sponsorPhone: ['sponsorphone', 'teléfono sponsor', 'telefono sponsor', 'celular sponsor'],
    sponsorRelation: ['sponsorrelationship', 'relación sponsor', 'parentesco', 'relacion con patrocinador', 'sponsor relation'],
    motherName: ['mothername', 'madre', 'nombre madre', 'mother', 'nombre completo madre'],
    motherBirthDate: ['motherbirthdate', 'nac madre', 'fecha nac madre', 'cumpleaños madre'],
    fatherName: ['fathername', 'padre', 'nombre padre', 'father', 'nombre completo padre'],
    fatherBirthDate: ['fatherbirthdate', 'nac padre', 'fecha nac padre', 'cumpleaños padre'],

    // --- Passport & Visa ---
    passportNumber: ['passport', 'pasaporte', 'número de pasaporte', 'nro pasaporte', 'passport / id', 'passportnumber'],
    passportIssueCountry: ['passportissuecountry', 'país emisión pasaporte', 'país de emisión', 'pais emision'],
    passportIssueCity: ['passportissuecity', 'ciudad emisión pasaporte', 'ciudad de emisión', 'ciudad emision'],
    passportState: ['passportstate', 'estado/provincia pasaporte', 'estado/provincia'],
    passportIssuedDate: ['passportissueddate', 'fecha emisión pasaporte', 'passport issue date', 'fecha de emisión'],
    passportExpiryDate: ['passportexpirydate', 'fecha vencimiento pasaporte', 'vencimiento pasaporte', 'passport expiry date', 'fecha de expiración'],
    passportLost: ['passportlost', '¿has perdido tu pasaporte alguna vez?', 'pasaporte perdido', 'lost passport'],

    hasTouristVisa: ['hastouristvisa', '¿tienes visa de turista actual?', 'visa turista', 'tiene visa?'],
    visaIssuedDate: ['visaissueddate', 'emisión visa', 'fecha emisión visa', 'visa issue date'],
    visaExpiryDate: ['visaexpirydate', 'expiración visa', 'fecha vencimiento visa', 'visa expiry date'],

    // --- System & Metadata ---
    source: ['source', 'fuente', 'origen', 'fuente de contacto'],
    stage: ['stage', 'etapa', 'fase', 'status', 'estado'],
    clientType: ['clienttype', 'tipo de cliente', 'tipo cliente', 'client type'],
    interests: ['interests', 'intereses'],
    serviceType: ['servicetype', 'servicio', 'tipo de servicio'],
    paymentStatus: ['paymentstatus', 'estado de pago', 'pago'],
    backupLink: ['backuplink', 'respaldo'],
    contractLink: ['contractlink', 'contrato'],
    invoiceLink: ['invoicelink', 'factura'],
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [rawContacts, setRawContacts] = useState<any[]>([]); // Unprocessed contacts for duplicate detection
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isMounted, setIsMounted] = useState(false);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDuplicateManagerOpen, setIsDuplicateManagerOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk', id?: string }>({ type: 'single' });

    // Handle client-side mounting and localStorage
    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const savedViewMode = localStorage.getItem('contactsViewMode');
            if (savedViewMode === 'list' || savedViewMode === 'grid') {
                setViewMode(savedViewMode);
            }
        }
    }, []);
    const [syncStatus, setSyncStatus] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // --- kamban SYNC LOGIC (Added for ConversationModal consistency) ---
    const [groups, setGroups] = useState<any[]>([]);
    const [allCards, setAllCards] = useState<any[]>([]);
    const [activeCard, setActiveCard] = useState<any>(null); // To pass to modal

    useEffect(() => {
        const groupsQuery = query(collection(db, 'kamban-groups'), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
            const groupsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setGroups(groupsFromDb);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const cardsQuery = query(collectionGroup(db, 'cards'));
        const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
            const allCardsFromDb = snapshot.docs.map(doc => {
                // Use Regex to safely extract groupId from path
                const match = doc.ref.path.match(/kamban-groups\/([^\/]+)\/cards/);
                const groupId = match ? match[1] : undefined;
                return { ...doc.data(), id: doc.id, groupId: groupId };
            });
            setAllCards(allCardsFromDb);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setIsLoadingContacts(true);
        const contactsQuery = query(collection(db, 'contacts'));
        const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
            const allContacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Robust in-memory sort by multiple possible timestamp fields
            const sortedContacts = [...allContacts].sort((a: any, b: any) => {
                const getTime = (ts: any) => {
                    if (!ts) return 0;
                    if (typeof ts.toMillis === 'function') return ts.toMillis();
                    if (ts.seconds !== undefined) return ts.seconds * 1000;
                    if (ts instanceof Date) return ts.getTime();
                    if (typeof ts === 'string') return new Date(ts).getTime();
                    return 0;
                };
                const timeA = getTime(a.createdAt) || getTime(a.importedAt) || getTime(a.lastUpdated) || 0;
                const timeB = getTime(b.createdAt) || getTime(b.importedAt) || getTime(b.lastUpdated) || 0;
                return timeB - timeA;
            });

            setRawContacts(sortedContacts);
            setContacts(processContacts(sortedContacts));
            setIsLoadingContacts(false);
        }, (error) => {
            console.error("Error fetching contacts:", error);
            setIsLoadingContacts(false);
            toast.error("Error al cargar contactos");
        });

        return () => unsubscribe();
    }, []);

    // Helper to find card for contact
    const findCardForContact = (contact: any) => {
        if (!contact) return null;

        // 1. Try match by ID (if stored)
        let found = allCards.find(c => c.contactId === contact.id);

        // 2. Try match by Phone (Normalized)
        if (!found && contact.phone) {
            const normalizedContactPhone = contact.phone.replace(/\D/g, '');
            found = allCards.find(c => (c.contactNumber || '').replace(/\D/g, '') === normalizedContactPhone);
        }

        // 3. Try match by ID as Card ID (Fallback)
        if (!found) {
            found = allCards.find(c => c.id === contact.id);
        }

        return found || null;
    };


    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedStages, setSelectedStages] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Helpers
    const getDateString = (value: any) => {
        if (!value) return '---';
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && 'seconds' in value) {
            return new Date(value.seconds * 1000).toLocaleDateString();
        }
        return '---';
    };

    const getDateInputValue = (value: any) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && 'seconds' in value) {
            return new Date(value.seconds * 1000).toISOString().split('T')[0];
        }
        return '';
    };

    const getAge = (birthDate: any) => {
        if (!birthDate) return null;
        let date: Date;
        if (typeof birthDate === 'string') {
            date = new Date(birthDate);
        } else if (birthDate && typeof birthDate === 'object' && 'seconds' in birthDate) {
            date = new Date(birthDate.seconds * 1000);
        } else {
            return null;
        }
        if (isNaN(date.getTime())) return null;
        return new Date().getFullYear() - date.getFullYear();
    };

    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

    // Generate a unique alphanumeric ID (e.g., RY7A2B9)
    const generateClientId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'RY'; // Prefix for Royalty
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Helper to process contacts: deduplicate and ensure clientId
    const processContacts = (data: any[]) => {
        const seenIds = new Set();

        const filtered = data.filter(contact => {
            if (!contact.id || seenIds.has(contact.id)) return false;
            seenIds.add(contact.id);
            return true;
        });

        const result = filtered.map((contact) => {
            if (!contact.clientId) {
                const derivedId = `RY${contact.id.substring(0, 5).toUpperCase()}`;
                return { ...contact, clientId: derivedId };
            }
            return contact;
        });

        return result;
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('contactsViewMode', viewMode);
        }
    }, [viewMode]);

    const smartParseDate = (value: any): string => {
        if (!value) return '';
        // 1. Excel Serial Date
        if (typeof value === 'number' && value > 20000) {
            const date = new Date((value - (25567 + 2)) * 86400 * 1000); // 25567 days from 1900 to 1970, +2 for leap year bugs
            return date.toISOString().split('T')[0];
        }

        const strVal = value.toString().trim();
        // 2. Already ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return strVal;

        // 3. DD/MM/YYYY or MM/DD/YYYY
        // Try to handle 19/04/2006
        const parts = strVal.split(/[\/\-]/);
        if (parts.length === 3) {
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let year = parseInt(parts[2]);

            // Handle 2-digit years heuristically
            if (year < 100) year += 2000;

            // Swap if US format seems likely (MM/DD/YYYY) - basic check
            // If first part > 12, it's definitely DAY. 
            // If second part > 12, it's definitely DAY (so first is month).
            if (month > 12 && day <= 12) {
                const temp = day; day = month; month = temp;
            }

            // Map month names (abr, ene, etc) if parsed as NaN
            if (isNaN(month)) {
                const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                const lowerPart1 = parts[1].toLowerCase().substring(0, 3);
                const idx = monthNames.findIndex(m => m === lowerPart1);
                if (idx !== -1) month = idx + 1;
            }

            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            }
        }
        return strVal; // Return original if unknown
    };

    const smartParseMoney = (value: any): string => {
        if (!value) return '';
        let str = value.toString();
        // remove symbols
        str = str.replace(/[^\d.,-]/g, '');
        // 1.200,00 -> 1200.00 (EU/Latam)
        // 1,200.00 -> 1200.00 (US)

        // If last separator is comma, assume decimal comma
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // remove commas
            str = str.replace(/,/g, '');
        }
        const num = parseFloat(str);
        return isNaN(num) ? '' : num.toString();
    };

    const findBestMatch = (header: string): string | null => {
        const normalized = header.toLowerCase().trim();

        // 1. Exact & Alias Match (High Confidence)
        for (const [key, aliases] of Object.entries(HEADER_MAPPING)) {
            if (aliases.includes(normalized)) return key;
        }

        // 2. Contains Match (Medium Confidence)
        // If the header literally contains one of the aliases (e.g. "my phone number" contains "phone")
        for (const [key, aliases] of Object.entries(HEADER_MAPPING)) {
            for (const alias of aliases) {
                if (alias.length > 3 && normalized.includes(alias)) return key;
            }
        }

        // 3. Heuristic / Semantic Match (Low Confidence but Smart)
        const rules: { [key: string]: (h: string) => boolean } = {
            passportExpiryDate: (h) => (h.includes('venc') || h.includes('caduc') || h.includes('expir')) && (h.includes('pasaporte') || h.includes('doc') || h.includes('viaje')),
            passportIssuedDate: (h) => (h.includes('emis') || h.includes('fecha')) && (h.includes('pasaporte') || h.includes('doc')),
            birthDate: (h) => (h.includes('nacim') || h.includes('naci')) && (h.includes('fecha') || h.includes('date')),
            usAddress: (h) => (h.includes('usa') || h.includes('eeuu') || h.includes('estados unidos')) && (h.includes('direc') || h.includes('domicilio') || h.includes('viv')),
            monthlySalary: (h) => (h.includes('ingresc') || h.includes('sueldo') || h.includes('gananc') || h.includes('mensual')),
            motherName: (h) => h.includes('madre') && (h.includes('nomb') || h.includes('apell')),
            fatherName: (h) => h.includes('padre') && (h.includes('nomb') || h.includes('apell')),
            hasSponsor: (h) => (h.includes('patrocin') || h.includes('sponsor')) && (h.includes('tien') || h.includes('?')),
            visaRejection: (h) => (h.includes('negad') || h.includes('recha') || h.includes('denied')) && (h.includes('visa')),
        };

        for (const [key, rule] of Object.entries(rules)) {
            if (rule(normalized)) return key;
        }

        return null;
    };

    const onImportDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsSyncing(true);
        setSyncStatus(`Procesando archivo...`);

        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    setSyncStatus("❌ Error: El archivo está vacío.");
                    setIsSyncing(false);
                    return;
                }

                const rawHeaders = jsonData[0].map((h: any) => h ? h.toString().trim() : '');
                const rows = jsonData.slice(1);

                let importedCount = 0;
                let skippedCount = 0;

                for (const row of rows) {
                    if (!row || row.length === 0) continue;

                    const rowDataTemp: any = {};
                    rawHeaders.forEach((header: string, index: number) => {
                        if (header) rowDataTemp[header] = row[index] || '';
                    });

                    // Comprehensive & Heuristic Mapping Logic
                    const mappedContact: any = JSON.parse(JSON.stringify(newContact));
                    const extraData: any = {};
                    // No need to track usedHeaders globally if we just iterate headers

                    Object.keys(rowDataTemp).forEach(header => {
                        const originalValue = rowDataTemp[header];
                        if (!originalValue && originalValue !== 0) return; // Skip empty cells

                        const matchedKey = findBestMatch(header);
                        let isMapped = false;

                        if (matchedKey) {
                            // Smart Parse before assigning
                            let finalValue = originalValue;
                            const lowerKey = matchedKey.toLowerCase();

                            if (lowerKey.includes('date') || lowerKey.includes('birth') || lowerKey.includes('expiry') || lowerKey.includes('issued')) {
                                finalValue = smartParseDate(originalValue);
                            } else if (lowerKey.includes('salary') || lowerKey.includes('income') || lowerKey.includes('cost') || lowerKey.includes('price')) {
                                finalValue = smartParseMoney(originalValue);
                            }

                            // Only assign if empty (handle duplicates priority: first come first serve)
                            if (!mappedContact[matchedKey]) {
                                mappedContact[matchedKey] = finalValue;
                                isMapped = true;
                            }
                        }

                        // If not mapped (or field was already full), add to Extra Data
                        if (!isMapped) {
                            let uniqueHeader = header;
                            let counter = 2;
                            while (extraData[uniqueHeader]) {
                                uniqueHeader = `${header} (${counter})`;
                                counter++;
                            }
                            extraData[uniqueHeader] = originalValue;
                        }
                    });
                    // Finalize contact data
                    if (!mappedContact.name && !rowDataTemp.nombre && !rowDataTemp.name) continue;
                    if (!mappedContact.name) mappedContact.name = rowDataTemp.name || rowDataTemp.nombre || 'Sin Nombre';

                    // Normalize phone and check duplicates
                    const phone = (mappedContact.phone || '').toString().replace(/[^\d+]/g, '');
                    // Check if phone exists in DB (simple check)
                    const isDuplicateInDB = contacts.some(c => c.phone && c.phone.replace(/[^\d+]/g, '') === phone);

                    if (phone && isDuplicateInDB) {
                        skippedCount++;
                        continue;
                    }

                    const contactId = Math.random().toString(36).substr(2, 9);
                    const finalContact = {
                        ...mappedContact,
                        phone: phone,
                        extraData: extraData,
                        id: contactId,
                        date: new Date().toISOString().split('T')[0],
                        createdAt: serverTimestamp(),
                        lastUpdated: serverTimestamp(),
                        importedFrom: 'excel',
                        clientId: generateClientId()
                    };

                    await setDoc(doc(db, 'contacts', contactId), sanitizeData(finalContact));
                    importedCount++;
                }

                setSyncStatus(`✅ Importación: ${importedCount} añadidos, ${skippedCount} duplicados omitidos.`);
                const querySnapshot = await getDocs(collection(db, 'contacts'));
                const allContacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setContacts(processContacts(allContacts));
                setTimeout(() => { setIsImportModalOpen(false); setSyncStatus(''); }, 2000);
            } catch (err) {
                console.error("Error parsing file:", err);
                setSyncStatus("❌ Error al procesar el archivo.");
            } finally {
                setIsSyncing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    const handleSynckambanContacts = async () => {
        setIsSyncing(true);
        setSyncStatus('Iniciando sincronización inteligente...');
        try {
            const cardsQuery = query(collectionGroup(db, 'cards'));
            const cardsSnapshot = await getDocs(cardsQuery);
            let importedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            // Dictionary to track cards by phone for auto-merging
            const phoneToCardsMap: { [key: string]: any[] } = {};

            for (const cardDoc of cardsSnapshot.docs) {
                const cardData = cardDoc.data() as any;
                if (!cardData.contactNumber) continue;

                // Use the standard normalization utility
                const phone = normalizePhoneNumber(cardData.contactNumber);
                if (!phone) continue;

                if (!phoneToCardsMap[phone]) phoneToCardsMap[phone] = [];
                phoneToCardsMap[phone].push({ id: cardDoc.id, ref: cardDoc.ref, ...cardData });
            }

            for (const phone in phoneToCardsMap) {
                const cardGroup = phoneToCardsMap[phone];
                let primaryCard = cardGroup[0];

                // --- AUTO MERGE kamban CARDS IF MULTIPLE EXIST ---
                if (cardGroup.length > 1) {
                    setSyncStatus(`Fusionando ${cardGroup.length} tarjetas para ${phone}...`);
                    // Sort by message count to pick best primary
                    const sortedGroup = [...cardGroup].sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));
                    primaryCard = sortedGroup[0];
                    const secondaryCards = sortedGroup.slice(1);

                    const mergedMessages = [...(primaryCard.messages || [])];
                    const mergedNotes = [...(primaryCard.notes || [])];
                    secondaryCards.forEach(s => {
                        if (s.messages) mergedMessages.push(...s.messages);
                        if (s.notes) mergedNotes.push(...s.notes);
                    });

                    // Utility for timestamps
                    const getMs = (ts: any) => {
                        if (!ts) return 0;
                        if (typeof ts.toMillis === 'function') return ts.toMillis();
                        if (ts.seconds !== undefined) return ts.seconds * 1000;
                        if (ts instanceof Date) return ts.getTime();
                        return 0;
                    };

                    // Dedup messages
                    const uniqueMessages = Array.from(new Map(mergedMessages.map(m => [`${m.sender}-${m.text}-${getMs(m.timestamp)}`, m])).values())
                        .sort((a, b) => getMs(a.timestamp) - getMs(b.timestamp));

                    await updateDoc(primaryCard.ref, {
                        messages: uniqueMessages,
                        notes: Array.from(new Map(mergedNotes.map(n => [n.id || JSON.stringify(n), n])).values()),
                        updatedAt: serverTimestamp()
                    });

                    for (const s of secondaryCards) {
                        await deleteDoc(s.ref);
                    }
                }

                // --- CRM SYNC LOGIC ---
                // 1. Check if contact already exists by phone (normalized match)
                // We fetch all and filter in memory to be safe with formatting variations, 
                // but usually the normalizePhoneNumber is stable.
                const existingContactQuery = query(collection(db, 'contacts'), where('phone', '==', phone));
                const existingDocs = await getDocs(existingContactQuery);

                const contactData: any = {
                    name: primaryCard.contactName || 'Sin Nombre',
                    email: primaryCard.email || '',
                    source: 'kamban',
                    stage: 'In Progress',
                    lastUpdated: serverTimestamp(),
                };

                if (!existingDocs.empty) {
                    // UPDATE EXISTING
                    const existingDoc = existingDocs.docs[0];
                    const existingData = existingDoc.data();
                    const mergedData: any = { ...contactData };

                    if (mergedData.name === 'Sin Nombre' && existingData.name !== 'Sin Nombre') delete mergedData.name;
                    if (!mergedData.email && existingData.email) delete mergedData.email;

                    const combinedTags = Array.from(new Set([...(existingData.tags || []), ...(primaryCard.tags || [])]));
                    mergedData.tags = combinedTags;

                    await updateDoc(doc(db, 'contacts', existingDoc.id), mergedData);
                    updatedCount++;
                } else {
                    // CREATE NEW
                    const newContactData = {
                        ...contactData,
                        phone: phone,
                        id: primaryCard.id,
                        importedFrom: 'kamban-kamban',
                        importedAt: serverTimestamp(),
                        date: new Date().toISOString().split('T')[0],
                        tags: primaryCard.tags || [],
                        clientId: generateClientId()
                    };
                    await setDoc(doc(db, 'contacts', primaryCard.id), newContactData);
                    importedCount++;
                }
            }
            setSyncStatus(`✅ Sincronización: ${importedCount} nuevos, ${updatedCount} actualizados.`);

            // Refresh local state
            const querySnapshot = await getDocs(collection(db, 'contacts'));
            const allContacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRawContacts(allContacts); // Update raw contacts for duplicate manager
            setContacts(processContacts(allContacts));
        } catch (error) {
            console.error('Error syncing contacts:', error);
            setSyncStatus(`❌ Error sincronizando.`);
        } finally {
            setIsSyncing(false);
        }
    };

    const [newContact, setNewContact] = useState({
        // Basic & Identity
        name: '', email: '', phone: '', source: 'Other', tags: [] as string[], stage: 'Prospecting',
        firstName: '', lastName: '', birthDate: '', gender: '' as 'man' | 'woman' | '', maritalStatus: 'single',
        nationality: '', birthCountry: '', birthCity: '', birthState: '', birthPlace: '', nationalId: '',

        // Address
        address: '', city: '', postalCode: '', state: '', country: '',
        usAddress: '',

        // Education
        schoolName: '', highSchoolProgram: '', universityName: '', profession: '',

        // Study Plans & Background
        studyReason: '', studyDuration: '', startSemester: '', preferredSchedule: '',
        destinationSchool: '', visaRejection: '',

        // Employment
        occupationData: '', currentEmployer: '', companyAddress: '', companyCity: '', companyPhone: '',
        monthlySalary: '', employmentStartDate: '', roleDescription: '', otherIncome: '', previousEmployment: '',

        // Passport & Visa
        passportNumber: '', passportIssueCountry: '', passportIssueCity: '', passportState: '',
        passportIssuedDate: '', passportExpiryDate: '', passportLost: 'no',
        hasTouristVisa: 'no', visaIssuedDate: '', visaExpiryDate: '',

        // Other
        hasOtherNationality: 'no', otherNationalityCountry: '', isPermanentResidentOther: 'no', permanentResidentCountry: '',
        spouseName: '', spouseBirthDate: '', marriageDate: '', spouseCity: '', spouseState: '', spouseCountry: '',

        // Family & Sponsor
        hasSponsor: 'no', sponsorFirstName: '', sponsorLastName: '', sponsorPhone: '', sponsorEmail: '', sponsorRelation: '',
        motherName: '', motherBirthDate: '', fatherName: '', fatherBirthDate: '',

        children: [] as any[],
        emergencyContacts: [] as any[],

        // Files
        documents: [] as any[],

        // Metadata
        clientType: 'persona' as 'persona' | 'empresa',
        interests: '', website: '',
        instagram: '', facebook: '', tiktok: '', linkedin: '', twitter: '',

        // Payment
        tdcNumber: '', tdcExpiry: '', tdcCvv: '', tddNumber: '', tddExpiry: '', tddCvv: '',
        serviceDetails: '', serviceType: '', paymentStatus: '', serviceStartDate: '', serviceDeliveryDate: '',
        backupLink: '', contractLink: '', invoiceLink: '',
        extraData: {} as any
    });

    const sanitizeData = (data: any) => {
        const sanitized = { ...data };
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === undefined) {
                sanitized[key] = '';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
                sanitized[key] = sanitizeData(sanitized[key]);
            }
        });
        return sanitized;
    };

    const handleAddContact = async () => {
        try {
            const hasName = (newContact.name || '').trim();
            const hasNames = (newContact.firstName || '').trim() || (newContact.lastName || '').trim();

            if (!hasName && !hasNames) {
                toast.error("El nombre es requerido");
                return;
            }

            if (!newContact.phone) {
                toast.error("El teléfono es requerido");
                return;
            }

            // Auto-generate name from first/last if missing
            let finalName = hasName;
            if (!finalName && hasNames) {
                finalName = `${newContact.firstName || ''} ${newContact.lastName || ''}`.trim();
            }

            // Sanitize Phone
            const sanitizedPhone = normalizePhoneNumber(newContact.phone);

            // --- PREVENT DUPLICATES ---
            if (sanitizedPhone) {
                const hasDuplicate = contacts.some(c =>
                    c.phone && c.phone.replace(/[^\d+]/g, '') === sanitizedPhone
                );

                if (hasDuplicate) {
                    toast.error(`Ya existe un contacto con el número ${sanitizedPhone}`);
                    return;
                }
            }

            const contactToSave = { ...newContact, name: finalName, phone: sanitizedPhone };

            // Create contact in Firestore (let Firestore generate the ID)
            const contactRef = await addDoc(collection(db, 'contacts'), {
                ...sanitizeData(contactToSave),
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });

            // Get the auto-generated Firestore ID
            const contactId = contactRef.id;

            // Derive clientId from Firestore ID (same as CreateClientModal)
            const derivedClientId = `RY${contactId.substring(0, 5).toUpperCase()}`;

            // Update the contact with the clientId
            await updateDoc(contactRef, {
                clientId: derivedClientId
            });

            // Add to local state
            const createdContact = {
                id: contactId,
                ...contactToSave,
                clientId: derivedClientId,
                date: new Date().toISOString().split('T')[0]
            };

            setContacts(prev => {
                const newList = [createdContact, ...prev];
                const seenIds = new Set();
                return newList.filter(c => {
                    if (!c.id || seenIds.has(c.id)) return false;
                    seenIds.add(c.id);
                    return true;
                });
            });
            setRawContacts(prev => [createdContact, ...prev]);
            setIsAddModalOpen(false);
            setNewContact({
                name: '', email: '', phone: '', source: 'Other', tags: [], stage: 'Prospecting',
                firstName: '', lastName: '', birthDate: '', gender: '', maritalStatus: 'single',
                nationality: '', birthCountry: '', birthCity: '', birthState: '', birthPlace: '', nationalId: '',

                address: '', city: '', postalCode: '', state: '', country: '', usAddress: '',

                schoolName: '', highSchoolProgram: '', universityName: '', profession: '',

                studyReason: '', studyDuration: '', startSemester: '', preferredSchedule: '',
                destinationSchool: '', visaRejection: '',

                occupationData: '', currentEmployer: '', companyAddress: '', companyCity: '', companyPhone: '',
                monthlySalary: '', employmentStartDate: '', roleDescription: '', otherIncome: '', previousEmployment: '',

                passportNumber: '', passportIssueCountry: '', passportIssueCity: '', passportState: '',
                passportIssuedDate: '', passportExpiryDate: '', passportLost: 'no',
                hasTouristVisa: 'no', visaIssuedDate: '', visaExpiryDate: '',

                hasOtherNationality: 'no', otherNationalityCountry: '', isPermanentResidentOther: 'no', permanentResidentCountry: '',
                spouseName: '', spouseBirthDate: '', marriageDate: '', spouseCity: '', spouseState: '', spouseCountry: '',

                hasSponsor: 'no', sponsorFirstName: '', sponsorLastName: '', sponsorPhone: '', sponsorEmail: '', sponsorRelation: '',
                motherName: '', motherBirthDate: '', fatherName: '', fatherBirthDate: '', children: [],

                emergencyContacts: [], documents: [],
                clientType: 'persona', interests: '', website: '',
                instagram: '', facebook: '', tiktok: '', linkedin: '', twitter: '',
                tdcNumber: '', tdcExpiry: '', tdcCvv: '', tddNumber: '', tddExpiry: '', tddCvv: '',
                serviceDetails: '', serviceType: '', paymentStatus: '', serviceStartDate: '', serviceDeliveryDate: '',
                backupLink: '', contractLink: '', invoiceLink: '',
                extraData: {}
            });
        } catch (error) { toast.error("Error al guardar."); }
    };

    const handleSaveContact = async () => {
        if (!selectedContact) return;
        try {
            const sanitizedPhone = normalizePhoneNumber(selectedContact.phone);
            const contactToSave = { ...selectedContact, phone: sanitizedPhone };

            const contactRef = doc(db, 'contacts', selectedContact.id);
            await setDoc(contactRef, { ...sanitizeData(contactToSave), lastUpdated: serverTimestamp() }, { merge: true });

            if (sanitizedPhone) {
                const cardsQuery = query(collectionGroup(db, 'cards'), where('contactNumber', '==', sanitizedPhone));
                const cardsSnapshot = await getDocs(cardsQuery);
                for (const cardDoc of cardsSnapshot.docs) {
                    await updateDoc(cardDoc.ref, sanitizeData({
                        contactName: selectedContact.name,
                        email: selectedContact.email || '',
                        company: selectedContact.company || '',
                        city: selectedContact.city || '',
                        profession: selectedContact.profession || '',
                        lastUpdated: serverTimestamp()
                    }));
                }
            }
            toast.success('Perfil actualizado');
            setContacts(contacts.map(c => c.id === selectedContact.id ? selectedContact : c));
            setIsDetailModalOpen(false);
            setIsEditingProfile(false);
        } catch (error) { toast.error("Error al actualizar."); }
    };

    const handleDeleteContact = async (id: string) => {
        setDeleteTarget({ type: 'single', id });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (deleteTarget.type === 'single' && deleteTarget.id) {
                await deleteDoc(doc(db, 'contacts', deleteTarget.id));
                setContacts(contacts.filter(c => c.id !== deleteTarget.id));
                setSelectedContactIds(prev => prev.filter(selectedId => selectedId !== deleteTarget.id));
                toast.success("Contacto eliminado");
            } else if (deleteTarget.type === 'bulk') {
                const batchPromises = selectedContactIds.map(id => deleteDoc(doc(db, 'contacts', id)));
                await Promise.all(batchPromises);
                setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
                setSelectedContactIds([]);
                toast.success(`${selectedContactIds.length} contactos eliminados`);
            }
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Error al eliminar.");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedContactIds.length === 0) return;
        setDeleteTarget({ type: 'bulk' });
        setIsDeleteDialogOpen(true);
    };

    const handleUpdateStage = (stage: string) => {
        if (!selectedContact) return;
        setSelectedContact({ ...selectedContact, stage });
    };

    const handleAddTag = () => {
        if (!newTag || !selectedContact) return;
        if (!selectedContact.tags.includes(newTag)) {
            setSelectedContact({ ...selectedContact, tags: [...selectedContact.tags, newTag] });
        }
        setNewTag('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (!selectedContact) return;
        setSelectedContact({ ...selectedContact, tags: selectedContact.tags.filter((t: string) => t !== tagToRemove) });
    };

    // Navigation
    const router = useRouter();

    const handleContactClick = (contact: any) => {
        setSelectedContact(contact);
        const associatedCard = findCardForContact(contact);

        if (associatedCard) {
            setActiveCard(associatedCard);
            setIsChatOpen(true);
        } else {
            // If no card exists, valid strategy: 
            // 1. Option A: Create a temp card object (visual only)
            // 2. Option B: Create a real card in "New Leads" (automated) -> preferred for consistency?
            // For now, let's try to simulate a card or just confirm if we want to create one.
            // Simplified: If no card, we can't open the full chat history yet. 
            // We'll simulate a minimal card to allow sending a first message which might create it?
            // Actually, ConversationModal expects a real card usually.

            // Temporary Fallback: Create a mock card structure to allow modal to open
            // NOTE: Sending a message from here might require specific handling if ID doesn't exist in DB.
            const mockCard = {
                id: contact.id, // Use contact ID temporarily? Or generate new?
                contactName: contact.name,
                contactNumber: contact.phone,
                email: contact.email,
                groupId: groups[0]?.id, // Default to first group (usu. "New Leads")
                messages: [],
                notes: [],
                // Indicate this is virtual/mock
                isVirtual: true
            };
            setActiveCard(mockCard);
            setIsChatOpen(true);

            // Ideally: The user should send a template to start.
        }
    };

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery);
        const matchesStage = selectedStages.length === 0 || selectedStages.includes(c.stage);
        const matchesSource = selectedSources.length === 0 || selectedSources.includes(c.source);
        const matchesTags = selectedTags.length === 0 || (c.tags && c.tags.some((tag: string) => selectedTags.includes(tag)));
        return matchesSearch && matchesStage && matchesSource && matchesTags;
    });

    const availableStages = Array.from(new Set(contacts.map(c => c.stage).filter(Boolean)));
    const availableSources = Array.from(new Set(contacts.map(c => c.source).filter(Boolean)));
    const availableTags = Array.from(new Set(contacts.flatMap(c => c.tags || []).filter(Boolean)));
    const activeFiltersCount = selectedStages.length + selectedSources.length + selectedTags.length;

    return (
        <div className="flex h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden font-sans">


            <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                {/* Enterprise Header Bar (Metrics) */}
                <div className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Total Database</span>
                            <span className="text-xl font-medium text-white">{contacts.length}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Active Leads</span>
                            <span className="text-xl font-medium text-blue-500">{contacts.filter(c => c.stage === 'In Progress').length}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Conversion</span>
                            <span className="text-xl font-medium text-emerald-500">{contacts.length > 0 ? Math.round((contacts.filter(c => c.stage === 'Closed').length / contacts.length) * 100) : 0}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">System Live</span>
                        </div>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto scrollbar-hide custom-scrollbar p-6 space-y-6">
                    <ContactHeader
                        isChatOpen={isChatOpen}
                        handleSynckambanContacts={handleSynckambanContacts}
                        isSyncing={isSyncing}
                        isImportModalOpen={isImportModalOpen}
                        setIsImportModalOpen={setIsImportModalOpen}
                        onImportDrop={onImportDrop}
                        isAddModalOpen={isAddModalOpen}
                        setIsAddModalOpen={setIsAddModalOpen}
                        newContact={newContact}
                        setNewContact={setNewContact}
                        handleAddContact={handleAddContact}
                        setIsDuplicateManagerOpen={setIsDuplicateManagerOpen}
                    />

                    {syncStatus && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg text-blue-400 font-medium text-sm">
                            {syncStatus}
                        </motion.div>
                    )}

                    <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4">
                        <ContactFilters
                            isChatOpen={isChatOpen}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            isFilterOpen={isFilterOpen}
                            setIsFilterOpen={setIsFilterOpen}
                            activeFiltersCount={activeFiltersCount}
                            clearAllFilters={() => { setSelectedStages([]); setSelectedSources([]); setSelectedTags([]); }}
                            availableStages={availableStages}
                            selectedStages={selectedStages}
                            setSelectedStages={setSelectedStages}
                            availableSources={availableSources}
                            selectedSources={selectedSources}
                            setSelectedSources={setSelectedSources}
                            availableTags={availableTags}
                            selectedTags={selectedTags}
                            setSelectedTags={setSelectedTags}
                            filteredCount={filteredContacts.length}
                            selectedCount={selectedContactIds.length}
                            handleBulkDelete={handleBulkDelete}
                        />
                    </div>

                    {isLoadingContacts ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <RefreshCw className="w-10 h-10 text-neutral-700 animate-spin mx-auto mb-4" />
                                <p className="text-neutral-500 font-medium text-xs uppercase tracking-widest">Consulting Core Database...</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {viewMode === 'list' ? (
                                <ContactList
                                    key="list"
                                    contacts={filteredContacts}
                                    containerVariants={containerVariants}
                                    itemVariants={itemVariants}
                                    isChatOpen={isChatOpen}
                                    handleContactClick={handleContactClick}
                                    setSelectedContact={setSelectedContact}
                                    setIsDetailModalOpen={setIsDetailModalOpen}
                                    setIsEditingProfile={setIsEditingProfile}
                                    handleDeleteContact={handleDeleteContact}
                                    selectedContactIds={selectedContactIds}
                                    setSelectedContactIds={setSelectedContactIds}
                                />
                            ) : (
                                <ContactGrid
                                    key="grid"
                                    contacts={filteredContacts}
                                    containerVariants={containerVariants}
                                    itemVariants={itemVariants}
                                    handleContactClick={handleContactClick}
                                    setSelectedContact={setSelectedContact}
                                    setIsDetailModalOpen={setIsDetailModalOpen}
                                    setIsEditingProfile={setIsEditingProfile}
                                    handleDeleteContact={handleDeleteContact}
                                    selectedContactIds={selectedContactIds}
                                    setSelectedContactIds={setSelectedContactIds}
                                />
                            )}
                        </AnimatePresence>
                    )}
                </main>
            </div>

            <ConversationModal
                key={selectedContact?.phone || 'no-contact'}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                card={selectedContact ? {
                    id: `temp-${selectedContact.id}`, // Temporary ID until real kamban card is found
                    contactName: selectedContact.name,
                    contactNumber: selectedContact.phone,
                    // Don't pass the CRM contact ID as card.id - let the hook find the real kamban card
                } : null}
                groups={[]}
                allConversations={contacts.map(c => ({ id: c.id, contactName: c.name, contactNumber: c.phone }))}
                onSelectConversation={(partial) => {
                    const fullContact = contacts.find(c => c.id === partial.id);
                    if (fullContact) {
                        setSelectedContact(fullContact);
                    }
                }}
                isGlobalContact={true}
                stats={{
                    totalConversations: contacts.length,
                    totalGroups: 0
                }}
                hideInternalTray={false}
                hideSidebar={true}
            />

            <ContactDetailsModal
                isOpen={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
                handleSaveContact={handleSaveContact}
                handleUpdateStage={handleUpdateStage}
                handleRemoveTag={handleRemoveTag}
                handleAddTag={handleAddTag}
                newTag={newTag}
                setNewTag={setNewTag}
                isAddingTag={isAddingTag}
                setIsAddingTag={setIsAddingTag}
                getDateString={getDateString}
                getDateInputValue={getDateInputValue}
                getAge={getAge}
            />

            <DuplicateManager
                isOpen={isDuplicateManagerOpen}
                onClose={() => setIsDuplicateManagerOpen(false)}
                contacts={rawContacts}
                onContactsUpdated={(updated) => {
                    setRawContacts(updated);
                    setContacts(processContacts(updated));
                }}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title={deleteTarget.type === 'single' ? 'Eliminar Contacto' : 'Eliminar Múltiples Contactos'}
                description={
                    deleteTarget.type === 'single'
                        ? 'Esta acción es permanente y no se puede deshacer. Todos los datos asociados a este contacto serán eliminados.'
                        : 'Esta acción es permanente y no se puede deshacer. Todos los datos asociados a estos contactos serán eliminados.'
                }
                itemCount={deleteTarget.type === 'bulk' ? selectedContactIds.length : 1}
            />
        </div>
    );
}

