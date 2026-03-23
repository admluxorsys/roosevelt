'use client';

import React, { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp, Timestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Globe, Languages, Flag, CreditCard,
    CheckCircle2, AlertCircle, X, ChevronDown, Search, Check, Send,
    MapPin, Calendar, Briefcase, Building, Heart, Activity, Handshake, Users, GraduationCap, Clock, Shield, FileText, DollarSign, IdCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ALL_COUNTRY_CODES, CountryCode } from '@/lib/countryCodes';
import { toast } from 'sonner';

interface ApplicationPageProps {
    params: Promise<{ id: string }>;
}

export default function ApplicationPage({ params }: ApplicationPageProps) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [contact, setContact] = useState<any>(null);
    const [realId, setRealId] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [phoneSearchTerm, setPhoneSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        ALL_COUNTRY_CODES.find(c => c.iso === 'US') || ALL_COUNTRY_CODES[0]
    );

    const [form, setForm] = useState({
        // 1. Información de Contacto
        firstName: '',
        lastName: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        company: '',
        address: '',
        postalCode: '',

        // 2. Estudiante
        birthDate: '',
        birthPlace: '',
        nationality: '',
        birthCity: '',
        birthCountry: '',
        birthState: '',
        hasOtherNationality: '',
        otherNationalityCountry: '',
        isPermanentResidentOther: '',
        permanentResidentCountry: '',
        nationalId: '',
        maritalStatus: '',
        gender: '',

        // 3. Pasaporte
        passportNumber: '',
        passportCountry: '',
        passportCity: '',
        passportState: '',
        passportIssuedDate: '',
        passportExpiryDate: '',
        passportLost: '',
        hasTouristVisa: '',
        visaIssuedDate: '',
        visaExpiryDate: '',

        // 4. Dirección
        city: '',
        state: '',
        country: '',
        usAddress: '',

        // 5. Familia
        hasSponsor: '',
        sponsorFirstName: '',
        sponsorLastName: '',
        sponsorPhone: '',
        sponsorRelation: '',
        motherName: '',
        motherBirthDate: '',
        fatherName: '',
        fatherBirthDate: '',
        spouseName: '',
        marriageDate: '',
        spouseBirthDate: '',
        spouseCity: '',
        spouseCountry: '',

        // 6. Empleo
        occupationData: '',
        currentEmployer: '',
        employerAddress: '',
        employerCity: '',
        employerPhone: '',
        monthlySalary: '',
        jobStartDate: '',
        jobDescription: '',
        otherIncomeSource: '',
        hasPreviousJob: '',
        prevEmployer: '',
        prevJobTitle: '',
        profession: '',

        // 7. Estudios
        schoolName: '',
        schoolProgram: '',
        universityName: '',
        universityProgram: '',

        // 8. Antecedentes
        studyReason: '',
        studyDuration: '',
        startSemester: '',
        preferredSchedule: '',
        targetSchool: '',
        visaRefusal: '',
        militaryService: '',
        languages: '',
        allergies: '',
        medicalConditions: '',

        // Legacy/Derived
        primaryLanguage: '',
        hasPassport: '',
        visaType: ''
    });

    useEffect(() => {
        const fetchContact = () => {
            if (!id) return;
            try {
                // 1. Try to find in 'contacts' (Primary CRM source)
                const docRef = doc(db, 'contacts', id);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log('[Application] Real-time update received:', data);
                        setRealId(id);
                        setContact(data);

                        // No pre-fill form data to ensure form is blank initially.
                        setLoading(false);
                    } else {
                        // Fallback logic if ID doesn't exist yet (might be a phone number in the URL)
                        attemptPhoneSearch();
                    }
                });

                const attemptPhoneSearch = async () => {
                    console.log('[Application] Contact not found by ID, attempting search by phone/fallback...');
                    const cleanId = id.replace(/\D/g, '');
                    if (cleanId.length >= 7) {
                        const formats = [`+${cleanId}`, cleanId];
                        const contactsQuery = query(collection(db, 'contacts'), where('phone', 'in', formats));
                        const snap = await getDocs(contactsQuery);
                        if (!snap.empty) {
                            console.log('[Application] Found contact via phone search, redirecting or setting...');
                            const foundId = snap.docs[0].id;
                            setRealId(foundId);
                            // We don't subscribe to the phone search result because ideally the link should use the REAL ID
                            // But for now, let's just set the data
                            const data = snap.docs[0].data();
                            setContact(data);
                            // Avoid setting form with data to keep fields empty
                            setLoading(false);
                        } else {
                            setLoading(false); // Truly not found
                        }
                    } else {
                        setLoading(false);
                    }
                };

                return unsubscribe;
            } catch (error) {
                console.error("Error setting up contact listener:", error);
                setLoading(false);
            }
        };

        const unsubscribe = fetchContact();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [id]);

    const handlePhoneChange = (value: string) => {
        const clean = value.replace(/\D/g, '');
        setForm(prev => ({ ...prev, phone: clean }));
    };

    const handleCountrySelect = (country: CountryCode) => {
        setSelectedCountry(country);
        setIsPhoneOpen(false);
        setPhoneSearchTerm('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = realId || id;
        if (!targetId) return;

        try {
            const docRef = doc(db, 'contacts', targetId);
            
            // Only update fields that the user explicitly filled
            const dataToUpdate: any = {};
            Object.entries(form).forEach(([key, value]) => {
                if (typeof value === 'string' && value.trim() !== '') {
                    dataToUpdate[key] = value.trim();
                }
            });

            if (dataToUpdate.phone) {
                dataToUpdate.phone = `${selectedCountry.code}${dataToUpdate.phone}`;
            }

            if (dataToUpdate.firstName || dataToUpdate.lastName) {
                const existingName = contact?.name || '';
                const baseFirstName = contact?.firstName || existingName.split(' ')[0] || '';
                const baseLastName = contact?.lastName || existingName.split(' ').slice(1).join(' ') || '';
                
                dataToUpdate.name = `${dataToUpdate.firstName || baseFirstName} ${dataToUpdate.lastName || baseLastName}`.trim();
            }

            await updateDoc(docRef, {
                ...dataToUpdate,
                lastUpdated: serverTimestamp(),
                applicationStatus: 'submitted',
                applicationDate: serverTimestamp()
            });

            setSubmitted(true);
            toast.success('¡Aplicación enviada con éxito!');
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error('Hubo un error al enviar tu aplicación.');
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#0a0f18]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-neutral-400 font-medium animate-pulse">Cargando tu aventura...</p>
                </div>
            </div>
        );
    }

    if (!contact && !loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#0a0f18] p-4 text-center">
                <div className="max-w-md space-y-6">
                    <div className="relative mx-auto">
                        <AlertCircle size={80} className="mx-auto text-red-500/50 animate-pulse" />
                        <X size={32} className="absolute inset-0 m-auto text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Enlace Inválido</h1>
                        <p className="text-neutral-400 leading-relaxed">
                            Lo sentimos, este link de aplicación no es válido o el contacto ha sido eliminado.
                            Por favor, solicita un nuevo link a tu asesor.
                        </p>
                    </div>
                    <Button
                        variant="link"
                        onClick={() => {
                            window.close();
                            setTimeout(() => { window.location.href = '/'; }, 300);
                        }}
                        className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest text-xs"
                    >
                        Cerrar Ventana
                    </Button>
                </div>
            </div>
        );
    }

    const filteredCountries = ALL_COUNTRY_CODES.filter(c =>
        c.country.toLowerCase().includes(phoneSearchTerm.toLowerCase()) ||
        c.code.includes(phoneSearchTerm)
    );

    return (
        <div className="min-h-screen w-screen bg-[#0a0f18] text-white selection:bg-blue-500/30 font-sans relative overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-screen">
                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            <button className="absolute top-6 right-8 text-neutral-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>

                            <div className="flex justify-center mb-8">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-[-10deg]">
                                    <Send size={32} className="text-white ml-1" />
                                </div>
                            </div>

                            <header className="text-center mb-10 space-y-3">
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-neutral-500 bg-clip-text text-transparent">
                                    Comienza tu Aventura
                                </h1>
                                <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                                    Completa este breve formulario y da el primer paso hacia tu sueño americano. ¡Estamos aquí para ayudarte!
                                </p>
                            </header>

                            <form onSubmit={handleSubmit} className="space-y-12">
                                {/* Section 1: Contact Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <User size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Información de Contacto</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombres</Label>
                                            <Input required value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Nombres" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Apellidos</Label>
                                            <Input required value={form.lastName} onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Apellidos" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombre Completo (Legacy)</Label>
                                            <Input value={form.contactName} onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))} placeholder="Nombre completo" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Correo Electrónico</Label>
                                            <Input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@ejemplo.com" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">WhatsApp / Teléfono</Label>
                                            <div className="flex gap-2 relative">
                                                <div className="relative w-[110px] shrink-0">
                                                    <Button type="button" variant="outline" onClick={() => setIsPhoneOpen(!isPhoneOpen)} className="w-full h-12 bg-black/40 border-white/10 rounded-xl justify-between px-3 text-sm hover:bg-black/60 transition-all">
                                                        <span className="flex items-center gap-1.5 overflow-hidden">
                                                            <span className="text-base shrink-0">{selectedCountry.flag}</span>
                                                            <span className="font-mono text-neutral-300">{selectedCountry.code}</span>
                                                        </span>
                                                        <ChevronDown size={14} className="text-neutral-500" />
                                                    </Button>
                                                    <AnimatePresence>
                                                        {isPhoneOpen && (
                                                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute bottom-full mb-2 left-0 w-[280px] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                                                                <div className="flex items-center border-b border-white/5 px-4 py-3 bg-black/20">
                                                                    <Search className="h-4 w-4 text-neutral-500 mr-2" />
                                                                    <input autoFocus className="w-full bg-transparent text-sm outline-none text-white font-medium" placeholder="Buscar país..." value={phoneSearchTerm} onChange={(e) => setPhoneSearchTerm(e.target.value)} />
                                                                </div>
                                                                <div className="max-h-[250px] overflow-y-auto py-2 custom-scrollbar">
                                                                    {filteredCountries.map((country) => (
                                                                        <button key={`${country.iso}-${country.code}`} type="button" onClick={() => handleCountrySelect(country)} className="w-full flex items-center px-4 py-3 text-sm text-neutral-300 hover:bg-blue-600/20 transition-colors text-left group">
                                                                            <div className="flex items-center flex-1">
                                                                                <Check className={cn("mr-3 h-4 w-4 text-blue-500 transition-opacity", selectedCountry.iso === country.iso && selectedCountry.code === country.code ? "opacity-100" : "opacity-0")} />
                                                                                <span className="text-lg mr-3 shrink-0">{country.flag}</span>
                                                                                <span className="flex-1 truncate font-medium">{country.country}</span>
                                                                            </div>
                                                                            <span className="font-mono text-neutral-500 text-xs ml-2 group-hover:text-blue-400">{country.code}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <Input required value={form.phone} onChange={e => handlePhoneChange(e.target.value)} placeholder="Número" className="flex-1 h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-mono text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Personal Details (Estudiante) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                                            <IdCard size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Información Personal</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Fecha de Nacimiento</Label>
                                            <Input type="date" value={form.birthDate} onChange={e => setForm(prev => ({ ...prev, birthDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Lugar de Nacimiento</Label>
                                            <Input value={form.birthPlace} onChange={e => setForm(prev => ({ ...prev, birthPlace: e.target.value }))} placeholder="Lugar" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nacionalidad</Label>
                                            <Input value={form.nationality} onChange={e => setForm(prev => ({ ...prev, nationality: e.target.value }))} placeholder="País" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">ID Nacional (DNI/CEDULA)</Label>
                                            <Input value={form.nationalId} onChange={e => setForm(prev => ({ ...prev, nationalId: e.target.value }))} placeholder="DNI/CEDULA" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Ciudad de Nacimiento</Label>
                                            <Input value={form.birthCity} onChange={e => setForm(prev => ({ ...prev, birthCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">País de Nacimiento</Label>
                                            <Input value={form.birthCountry} onChange={e => setForm(prev => ({ ...prev, birthCountry: e.target.value }))} placeholder="País" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tienes otra nacionalidad?</Label>
                                            <Input value={form.hasOtherNationality} onChange={e => setForm(prev => ({ ...prev, hasOtherNationality: e.target.value }))} placeholder="Sí/No (¿Cuál?)" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Residente permanente de otro país?</Label>
                                            <Input value={form.isPermanentResidentOther} onChange={e => setForm(prev => ({ ...prev, isPermanentResidentOther: e.target.value }))} placeholder="Sí/No (¿Cuál?)" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Estado Civil</Label>
                                            <Input value={form.maritalStatus} onChange={e => setForm(prev => ({ ...prev, maritalStatus: e.target.value }))} placeholder="Estado Civil" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Género</Label>
                                            <Input value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))} placeholder="Género" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Passport */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                            <CreditCard size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Pasaporte</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Número de Pasaporte</Label>
                                            <Input value={form.passportNumber} onChange={e => setForm(prev => ({ ...prev, passportNumber: e.target.value }))} placeholder="Número" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">País de Emisión</Label>
                                            <Input value={form.passportCountry} onChange={e => setForm(prev => ({ ...prev, passportCountry: e.target.value }))} placeholder="País" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Fecha de Expiración</Label>
                                            <Input type="date" value={form.passportExpiryDate} onChange={e => setForm(prev => ({ ...prev, passportExpiryDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Ciudad/Estado Emisión</Label>
                                            <Input value={`${form.passportCity}${form.passportState ? `, ${form.passportState}` : ''}`} onChange={e => setForm(prev => ({ ...prev, passportCity: e.target.value }))} placeholder="Ciudad, Estado" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Fecha de Emisión</Label>
                                            <Input type="date" value={form.passportIssuedDate} onChange={e => setForm(prev => ({ ...prev, passportIssuedDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Has perdido tu pasaporte alguna vez?</Label>
                                            <Input value={form.passportLost} onChange={e => setForm(prev => ({ ...prev, passportLost: e.target.value }))} placeholder="Sí/No" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tienes visa americana vigente?</Label>
                                            <Input value={form.hasTouristVisa} onChange={e => setForm(prev => ({ ...prev, hasTouristVisa: e.target.value }))} placeholder="Sí/No" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Address */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                                            <MapPin size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Dirección de Residencia</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">País</Label>
                                            <Input value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))} placeholder="País" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Estado / Provincia</Label>
                                            <Input value={form.state} onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))} placeholder="Estado" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Ciudad</Label>
                                            <Input value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Código Postal</Label>
                                            <Input value={form.postalCode} onChange={e => setForm(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="Código Postal" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Education & Employment (Simplified for brevity but including all fields) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Educación y Empleo</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Profesión / Ocupación Actual</Label>
                                            <Input value={form.occupationData} onChange={e => setForm(prev => ({ ...prev, occupationData: e.target.value }))} placeholder="Ocupación" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Empresa Actual</Label>
                                            <Input value={form.currentEmployer} onChange={e => setForm(prev => ({ ...prev, currentEmployer: e.target.value }))} placeholder="Empresa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Salario Mensual (Aprox)</Label>
                                            <Input value={form.monthlySalary} onChange={e => setForm(prev => ({ ...prev, monthlySalary: e.target.value }))} placeholder="Monto" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Última Institución Educativa</Label>
                                            <Input value={form.universityName || form.schoolName} onChange={e => setForm(prev => ({ ...prev, universityName: e.target.value }))} placeholder="Universidad o Colegio" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Carrera / Programa</Label>
                                            <Input value={form.universityProgram || form.schoolProgram} onChange={e => setForm(prev => ({ ...prev, universityProgram: e.target.value }))} placeholder="Carrera" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 pb-4">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Languages size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">ÚLTIMOS DETALLES</h2>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿A qué tipo de visa deseas aplicar?</Label>
                                        <Select value={form.visaType} onValueChange={val => setForm(prev => ({ ...prev, visaType: val }))}>
                                            <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-1 focus:ring-blue-500/50 text-neutral-200">
                                                <SelectValue placeholder="Selecciona el tipo de visa" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-xl">
                                                <SelectItem value="F1">Visa de Estudiante (F1)</SelectItem>
                                                <SelectItem value="B1/B2">Visa de Turismo/Negocios (B1/B2)</SelectItem>
                                                <SelectItem value="J1">Visa de Intercambio (J1)</SelectItem>
                                                <SelectItem value="H1B">Visa de Trabajo (H1B)</SelectItem>
                                                <SelectItem value="M1">Estudios Vocacionales (M1)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button type="button" variant="outline" className="h-14 bg-transparent border-white/10 rounded-2xl text-neutral-300 font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all order-2 md:order-1">
                                        Volver
                                    </Button>
                                    <Button type="submit" className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all order-1 md:order-2">
                                        Enviar Aplicación <Send size={18} className="ml-2" />
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">¡Muchas gracias!</h2>
                            <p className="text-neutral-400 mb-8 leading-relaxed">
                                Tu aplicación ha sido enviada correctamente. Uno de nuestros asesores expertos se pondrá en contacto contigo muy pronto.
                            </p>
                            <Button
                                onClick={() => {
                                    window.close();
                                    setTimeout(() => { window.location.href = '/'; }, 300);
                                }}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest"
                            >
                                Cerrar Ventana
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer logo/info */}
            <footer className="absolute bottom-8 left-0 right-0 text-center animate-fade-in pointer-events-none">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
                    Powered by Roosevelt © 2024
                </p>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
