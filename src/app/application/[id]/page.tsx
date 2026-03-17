'use client';

import React, { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp, Timestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Globe, Languages, Flag, CreditCard,
    CheckCircle2, AlertCircle, X, ChevronDown, Search, Check, Send,
    MapPin, Calendar, Briefcase, Building, Heart, Activity, Handshake, Users, GraduationCap, Clock, Shield, FileText, DollarSign, IdCard, Library
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
        // 0. Selección de Visa
        visaType: '',
        selectedSchool: '',

        // 1. Información Personal
        lastName: '',
        firstName: '',
        birthDate: '',
        birthPlace: '',
        city: '',
        state: '',
        country: '',
        hasOtherNationality: 'No',
        nationalId: '',
        maritalStatus: '',

        // 2. Pasaporte y Visa
        passportNumber: '',
        passportCity: '',
        passportState: '',
        passportIssuedDate: '',
        passportExpiryDate: '',
        passportLost: 'No',
        hasTouristVisa: 'No',

        // 3. Dirección y Contacto
        currentAddress: '',
        currentCity: '',
        currentState: '',
        currentCountry: '',
        postalCode: '',
        phone: '',
        email: '',

        // 4. Patrocinador (Sponsor)
        hasSponsor: 'No',
        sponsorLastName: '',
        sponsorFirstName: '',
        sponsorPhone: '',
        sponsorEmail: '',
        sponsorRelation: '',

        // 5. Familia
        hasChildrenComing: 'No',
        childNames: '',
        childLastNames: '',
        childBirthDate: '',
        childAddress: '',
        childHasPassport: 'No',
        childPassportNumber: '',
        childPassportCity: '',
        childPassportState: '',
        childPassportIssuedDate: '',
        childPassportExpiryDate: '',
        motherName: '',
        motherBirthDate: '',
        fatherName: '',
        fatherBirthDate: '',

        // 6. Empleo Actual
        currentRole: '',
        currentEmployer: '',
        employerAddress: '',
        employerCity: '',
        employerState: '',
        employerPostalCode: '',
        employerPhone: '',
        jobStartDate: '',
        monthlySalary: '',
        jobDescription: '',
        hasMoreIncome: 'No',

        // 7. Empleo Anterior
        hasPreviousJob: 'No',
        prevEmployer: '',
        prevEmployerAddress: '',
        prevEmployerCity: '',
        prevEmployerState: '',
        prevEmployerPostalCode: '',
        prevJobTitle: '',
        prevSupervisor: '',
        prevJobDescription: '',
        prevJobStartDate: '',
        prevJobEndDate: '',

        // 8. Educación Secundaria
        schoolName: '',
        schoolAddress: '',
        schoolProgram: '',
        schoolCity: '',
        schoolState: '',
        schoolStartDate: '',
        schoolEndDate: '',

        // 9. Educación Universitaria
        hasUniversity: 'No',
        universityName: '',
        universityAddress: '',
        universityProgram: '',
        universityCity: '',
        universityStartDate: '',
        universityEndDate: '',

        // 10. Detalles de Viaje y Otros
        usStayAddress: '',
        hasBeenToUS: 'No',
        hasUSVisa: 'No',
        changedPhoneLast5Years: 'No',
        instagramLink: '',
        facebookLink: '',
        linkedinLink: '',
        hasFamilyInUS: 'No',
        languages: '',
        visitedOtherCountries: 'No',
        militaryService: 'No'
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
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12 md:py-24 flex items-center justify-center min-h-screen">
                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-6xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
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
                                {/* Section 0: Tipo de Visa */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <FileText size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">¿A qué visa estás aplicando?</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Tipo de Visa</Label>
                                            <Select value={form.visaType} onValueChange={val => setForm(prev => ({ ...prev, visaType: val, selectedSchool: val === 'Visa F1' ? prev.selectedSchool : '' }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Turista">Turista</SelectItem>
                                                    <SelectItem value="Visa F1">Visa F1</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {form.visaType === 'Visa F1' && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="space-y-2"
                                            >
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Institución / Escuela</Label>
                                                <Select value={form.selectedSchool} onValueChange={val => setForm(prev => ({ ...prev, selectedSchool: val }))}>
                                                    <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                        <SelectValue placeholder="Selecciona Escuela" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                        <SelectItem value="Lumos">Lumos</SelectItem>
                                                        <SelectItem value="Uceda">Uceda</SelectItem>
                                                        <SelectItem value="Mila">Mila</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 1: Información Personal */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <User size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">1. Información Personal</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Apellidos</Label>
                                            <Input required value={form.lastName} onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Ej: Solis Arias" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Nombres</Label>
                                            <Input required value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Ej: Nicole Geovanna" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-medium text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de Nacimiento</Label>
                                            <Input required type="date" value={form.birthDate} onChange={e => setForm(prev => ({ ...prev, birthDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Lugar de Nacimiento</Label>
                                            <Input required value={form.birthPlace} onChange={e => setForm(prev => ({ ...prev, birthPlace: e.target.value }))} placeholder="Ej: Quito" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad</Label>
                                            <Input required value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Ej: Quito" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Estado / Provincia / Departamento</Label>
                                            <Input required value={form.state} onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))} placeholder="Ej: Pichincha" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">País</Label>
                                            <Input required value={form.country} onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Ej: Ecuador" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Tienes nacionalidad de algún otro país?</Label>
                                            <Select value={form.hasOtherNationality} onValueChange={val => setForm(prev => ({ ...prev, hasOtherNationality: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Número de Identificación Nacional (Cédula)</Label>
                                            <Input required value={form.nationalId} onChange={e => setForm(prev => ({ ...prev, nationalId: e.target.value }))} placeholder="Identificación" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Estado Civil</Label>
                                            <Input required value={form.maritalStatus} onChange={e => setForm(prev => ({ ...prev, maritalStatus: e.target.value }))} placeholder="Ej: Soltero/a" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Pasaporte */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <CreditCard size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">2. Pasaporte</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Número de Pasaporte</Label>
                                            <Input required value={form.passportNumber} onChange={e => setForm(prev => ({ ...prev, passportNumber: e.target.value }))} placeholder="Número" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad donde se emitió el pasaporte</Label>
                                            <Input required value={form.passportCity} onChange={e => setForm(prev => ({ ...prev, passportCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Provincia donde se emitió</Label>
                                            <Input required value={form.passportState} onChange={e => setForm(prev => ({ ...prev, passportState: e.target.value }))} placeholder="Provincia" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de emisión del pasaporte</Label>
                                            <Input required type="date" value={form.passportIssuedDate} onChange={e => setForm(prev => ({ ...prev, passportIssuedDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de expiración del pasaporte</Label>
                                            <Input required type="date" value={form.passportExpiryDate} onChange={e => setForm(prev => ({ ...prev, passportExpiryDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Has perdido tu pasaporte alguna vez?</Label>
                                            <Select value={form.passportLost} onValueChange={val => setForm(prev => ({ ...prev, passportLost: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Tienes visa de turista?</Label>
                                            <Select value={form.hasTouristVisa} onValueChange={val => setForm(prev => ({ ...prev, hasTouristVisa: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Dirección y Contacto */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <MapPin size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">3. Dirección y Contacto</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Dirección actual</Label>
                                            <Input required value={form.currentAddress} onChange={e => setForm(prev => ({ ...prev, currentAddress: e.target.value }))} placeholder="Calle principal, secundaria, barrio..." className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad</Label>
                                                <Input required value={form.currentCity} onChange={e => setForm(prev => ({ ...prev, currentCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Provincia</Label>
                                                <Input required value={form.currentState} onChange={e => setForm(prev => ({ ...prev, currentState: e.target.value }))} placeholder="Provincia" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">País</Label>
                                                <Input required value={form.currentCountry} onChange={e => setForm(prev => ({ ...prev, currentCountry: e.target.value }))} placeholder="País" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Código Postal</Label>
                                                <Input required value={form.postalCode} onChange={e => setForm(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="CP" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Número de Celular</Label>
                                                <Input required value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Número" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all font-mono text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 ml-1">Email</Label>
                                                <Input required type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@ejemplo.com" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Patrocinador (Sponsor) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Handshake size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">4. Patrocinador (Sponsor)</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tienes Patrocinador/Sponsor?</Label>
                                            <Select value={form.hasSponsor} onValueChange={val => setForm(prev => ({ ...prev, hasSponsor: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {form.hasSponsor === 'Sí' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Apellidos del patrocinador</Label>
                                                    <Input value={form.sponsorLastName} onChange={e => setForm(prev => ({ ...prev, sponsorLastName: e.target.value }))} placeholder="Apellidos" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Nombres del patrocinador</Label>
                                                    <Input value={form.sponsorFirstName} onChange={e => setForm(prev => ({ ...prev, sponsorFirstName: e.target.value }))} placeholder="Nombres" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Celular del patrocinador</Label>
                                                    <Input value={form.sponsorPhone} onChange={e => setForm(prev => ({ ...prev, sponsorPhone: e.target.value }))} placeholder="Celular" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Email del patrocinador</Label>
                                                    <Input type="email" value={form.sponsorEmail} onChange={e => setForm(prev => ({ ...prev, sponsorEmail: e.target.value }))} placeholder="Email" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Parentesco</Label>
                                                    <Input value={form.sponsorRelation} onChange={e => setForm(prev => ({ ...prev, sponsorRelation: e.target.value }))} placeholder="Ej: Papá, Madre, Tío..." className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 5: Familia */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Users size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">5. Familia</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tienes hijos?</Label>
                                            <Select value={form.hasChildrenComing} onValueChange={val => setForm(prev => ({ ...prev, hasChildrenComing: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {form.hasChildrenComing === 'Sí' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-l-2 border-blue-500/20 pl-6 space-y-4 md:space-y-0"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Nombres de hijos</Label>
                                                    <Input value={form.childNames} onChange={e => setForm(prev => ({ ...prev, childNames: e.target.value }))} placeholder="Nombres" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Apellidos de hijos</Label>
                                                    <Input value={form.childLastNames} onChange={e => setForm(prev => ({ ...prev, childLastNames: e.target.value }))} placeholder="Apellidos" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de nacimiento de hijos</Label>
                                                    <Input type="date" value={form.childBirthDate} onChange={e => setForm(prev => ({ ...prev, childBirthDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección de hijos</Label>
                                                    <Input value={form.childAddress} onChange={e => setForm(prev => ({ ...prev, childAddress: e.target.value }))} placeholder="Dirección completa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">¿Tienen pasaporte?</Label>
                                                    <Select value={form.childHasPassport} onValueChange={val => setForm(prev => ({ ...prev, childHasPassport: val }))}>
                                                        <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                            <SelectItem value="Sí">Sí</SelectItem>
                                                            <SelectItem value="No">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {form.childHasPassport === 'Sí' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-full pt-4 border-t border-white/5"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Número de pasaporte (Hijos)</Label>
                                                            <Input value={form.childPassportNumber} onChange={e => setForm(prev => ({ ...prev, childPassportNumber: e.target.value }))} placeholder="Número" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white font-mono" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad de emisión</Label>
                                                            <Input value={form.childPassportCity} onChange={e => setForm(prev => ({ ...prev, childPassportCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Provincia/Estado de emisión</Label>
                                                            <Input value={form.childPassportState} onChange={e => setForm(prev => ({ ...prev, childPassportState: e.target.value }))} placeholder="Provincia" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de emisión</Label>
                                                            <Input type="date" value={form.childPassportIssuedDate} onChange={e => setForm(prev => ({ ...prev, childPassportIssuedDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de expiración</Label>
                                                            <Input type="date" value={form.childPassportExpiryDate} onChange={e => setForm(prev => ({ ...prev, childPassportExpiryDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombre completo de la mamá</Label>
                                                <Input required value={form.motherName} onChange={e => setForm(prev => ({ ...prev, motherName: e.target.value }))} placeholder="Nombre" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Fecha de nacimiento mamá</Label>
                                                <Input required type="date" value={form.motherBirthDate} onChange={e => setForm(prev => ({ ...prev, motherBirthDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Nombre completo del papá</Label>
                                                <Input required value={form.fatherName} onChange={e => setForm(prev => ({ ...prev, fatherName: e.target.value }))} placeholder="Nombre" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Fecha de nacimiento papá</Label>
                                                <Input required type="date" value={form.fatherBirthDate} onChange={e => setForm(prev => ({ ...prev, fatherBirthDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Empleo Actual */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">6. Empleo Actual</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Rol / Ocupación actual</Label>
                                            <Input required value={form.currentRole} onChange={e => setForm(prev => ({ ...prev, currentRole: e.target.value }))} placeholder="Ej: Ciencias Sociales" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Nombre de la empresa actual</Label>
                                            <Input required value={form.currentEmployer} onChange={e => setForm(prev => ({ ...prev, currentEmployer: e.target.value }))} placeholder="Empresa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección empresa</Label>
                                            <Input required value={form.employerAddress} onChange={e => setForm(prev => ({ ...prev, employerAddress: e.target.value }))} placeholder="Dirección completa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad empresa</Label>
                                            <Input required value={form.employerCity} onChange={e => setForm(prev => ({ ...prev, employerCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Provincia empresa</Label>
                                            <Input required value={form.employerState} onChange={e => setForm(prev => ({ ...prev, employerState: e.target.value }))} placeholder="Provincia" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Código Postal empresa</Label>
                                            <Input required value={form.employerPostalCode} onChange={e => setForm(prev => ({ ...prev, employerPostalCode: e.target.value }))} placeholder="CP" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Teléfono empresa</Label>
                                            <Input required value={form.employerPhone} onChange={e => setForm(prev => ({ ...prev, employerPhone: e.target.value }))} placeholder="Teléfono" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de inicio en el trabajo actual</Label>
                                            <Input required type="date" value={form.jobStartDate} onChange={e => setForm(prev => ({ ...prev, jobStartDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Salario mensual (en moneda local)</Label>
                                            <Input required value={form.monthlySalary} onChange={e => setForm(prev => ({ ...prev, monthlySalary: e.target.value }))} placeholder="Ej: 900" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Descripción breve del trabajo</Label>
                                            <Input required value={form.jobDescription} onChange={e => setForm(prev => ({ ...prev, jobDescription: e.target.value }))} placeholder="¿Qué haces en tu trabajo?" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Tienes más fuentes de ingreso?</Label>
                                            <Input value={form.hasMoreIncome} onChange={e => setForm(prev => ({ ...prev, hasMoreIncome: e.target.value }))} placeholder="Sí/No (¿Cuáles?)" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 7: Empleo Anterior */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Briefcase size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">7. Empleo Anterior</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tuviste empleo anterior?</Label>
                                            <Select value={form.hasPreviousJob} onValueChange={val => setForm(prev => ({ ...prev, hasPreviousJob: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {form.hasPreviousJob === 'Sí' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Nombre empresa anterior</Label>
                                                    <Input value={form.prevEmployer} onChange={e => setForm(prev => ({ ...prev, prevEmployer: e.target.value }))} placeholder="Empresa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección empresa anterior</Label>
                                                    <Input value={form.prevEmployerAddress} onChange={e => setForm(prev => ({ ...prev, prevEmployerAddress: e.target.value }))} placeholder="Dirección" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad</Label>
                                                    <Input value={form.prevEmployerCity} onChange={e => setForm(prev => ({ ...prev, prevEmployerCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Provincia</Label>
                                                    <Input value={form.prevEmployerState} onChange={e => setForm(prev => ({ ...prev, prevEmployerState: e.target.value }))} placeholder="Provincia" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Código Postal</Label>
                                                    <Input value={form.prevEmployerPostalCode} onChange={e => setForm(prev => ({ ...prev, prevEmployerPostalCode: e.target.value }))} placeholder="CP" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Cargo anterior</Label>
                                                    <Input value={form.prevJobTitle} onChange={e => setForm(prev => ({ ...prev, prevJobTitle: e.target.value }))} placeholder="Cargo" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Nombre del supervisor</Label>
                                                    <Input value={form.prevSupervisor} onChange={e => setForm(prev => ({ ...prev, prevSupervisor: e.target.value }))} placeholder="Supervisor" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Descripción breve del trabajo anterior</Label>
                                                    <Input value={form.prevJobDescription} onChange={e => setForm(prev => ({ ...prev, prevJobDescription: e.target.value }))} placeholder="¿Qué hacías?" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de inicio empleo anterior</Label>
                                                    <Input type="date" value={form.prevJobStartDate} onChange={e => setForm(prev => ({ ...prev, prevJobStartDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de término empleo anterior</Label>
                                                    <Input type="date" value={form.prevJobEndDate} onChange={e => setForm(prev => ({ ...prev, prevJobEndDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Section 8: Educación Secundaria */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <GraduationCap size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">8. Educación Secundaria</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Nombre del Colegio / Institución Secundaria</Label>
                                            <Input required value={form.schoolName} onChange={e => setForm(prev => ({ ...prev, schoolName: e.target.value }))} placeholder="Nombre" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección del Colegio</Label>
                                            <Input required value={form.schoolAddress} onChange={e => setForm(prev => ({ ...prev, schoolAddress: e.target.value }))} placeholder="Dirección" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Programa secundario</Label>
                                            <Input required value={form.schoolProgram} onChange={e => setForm(prev => ({ ...prev, schoolProgram: e.target.value }))} placeholder="Ej: Ciencias Generales" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de inicio secundaria</Label>
                                            <Input required type="month" value={form.schoolStartDate} onChange={e => setForm(prev => ({ ...prev, schoolStartDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de fin secundaria</Label>
                                            <Input required type="month" value={form.schoolEndDate} onChange={e => setForm(prev => ({ ...prev, schoolEndDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 9: Educación Universitaria */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            <Library size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">9. Educación Universitaria</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">¿Tienes estudios universitarios?</Label>
                                            <Select value={form.hasUniversity} onValueChange={val => setForm(prev => ({ ...prev, hasUniversity: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {form.hasUniversity === 'Sí' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Nombre de la Universidad</Label>
                                                    <Input value={form.universityName} onChange={e => setForm(prev => ({ ...prev, universityName: e.target.value }))} placeholder="Nombre" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2 col-span-full">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección de la Universidad</Label>
                                                    <Input value={form.universityAddress} onChange={e => setForm(prev => ({ ...prev, universityAddress: e.target.value }))} placeholder="Dirección" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Carrera / Programa</Label>
                                                    <Input value={form.universityProgram} onChange={e => setForm(prev => ({ ...prev, universityProgram: e.target.value }))} placeholder="Programa" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Ciudad</Label>
                                                    <Input value={form.universityCity} onChange={e => setForm(prev => ({ ...prev, universityCity: e.target.value }))} placeholder="Ciudad" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de inicio universidad</Label>
                                                    <Input type="month" value={form.universityStartDate} onChange={e => setForm(prev => ({ ...prev, universityStartDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-neutral-500 ml-1">Fecha de fin universidad</Label>
                                                    <Input type="month" value={form.universityEndDate} onChange={e => setForm(prev => ({ ...prev, universityEndDate: e.target.value }))} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 10: Detalles de Viaje y Otros */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                            <Globe size={20} />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-white">10. Viaje y Otros</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 col-span-full">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Dirección donde se hospedará en EE.UU.</Label>
                                            <Input value={form.usStayAddress} onChange={e => setForm(prev => ({ ...prev, usStayAddress: e.target.value }))} placeholder="Estado / Ciudad / Dirección" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Ha estado antes en Estados Unidos?</Label>
                                            <Select value={form.hasBeenToUS} onValueChange={val => setForm(prev => ({ ...prev, hasBeenToUS: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Ha tenido visa americana antes?</Label>
                                            <Select value={form.hasUSVisa} onValueChange={val => setForm(prev => ({ ...prev, hasUSVisa: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Cambio de número celular últimos 5 años?</Label>
                                            <Select value={form.changedPhoneLast5Years} onValueChange={val => setForm(prev => ({ ...prev, changedPhoneLast5Years: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Link Instagram personal</Label>
                                            <Input value={form.instagramLink} onChange={e => setForm(prev => ({ ...prev, instagramLink: e.target.value }))} placeholder="Instagram" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Link Facebook personal</Label>
                                            <Input value={form.facebookLink} onChange={e => setForm(prev => ({ ...prev, facebookLink: e.target.value }))} placeholder="Facebook" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Familia en Estados Unidos?</Label>
                                            <Select value={form.hasFamilyInUS} onValueChange={val => setForm(prev => ({ ...prev, hasFamilyInUS: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">Idiomas que habla</Label>
                                            <Input value={form.languages} onChange={e => setForm(prev => ({ ...prev, languages: e.target.value }))} placeholder="Ej: Español, Inglés" className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Viajes internacionales últimos 5 años?</Label>
                                            <Select value={form.visitedOtherCountries} onValueChange={val => setForm(prev => ({ ...prev, visitedOtherCountries: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500 ml-1">¿Servicio militar?</Label>
                                            <Select value={form.militaryService} onValueChange={val => setForm(prev => ({ ...prev, militaryService: val }))}>
                                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                    <SelectItem value="Sí">Sí</SelectItem>
                                                    <SelectItem value="No">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button type="button" variant="outline" className="h-14 bg-transparent border-white/10 rounded-2xl text-neutral-300 font-bold tracking-tight hover:bg-white/5 hover:text-white transition-all order-2 md:order-1">
                                        Volver
                                    </Button>
                                    <Button type="submit" className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold tracking-tight shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all order-1 md:order-2">
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
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-tight"
                            >
                                Cerrar Ventana
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer logo/info */}
            <footer className="absolute bottom-8 left-0 right-0 text-center animate-fade-in pointer-events-none">
                <p className="text-[10px] font-bold text-neutral-600 tracking-wide">
                    Powered by uDreamms © 2024
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
