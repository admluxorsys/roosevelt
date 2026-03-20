import React from 'react';
import {
    Activity, AlertCircle, AlertTriangle, ArrowUpRight, Briefcase, Building, Calendar, Check, CheckCircle, ChevronDown, ChevronRight, ChevronsUpDown, Clock, Copy, CreditCard, DollarSign, Edit2, ExternalLink, Facebook, FileSpreadsheet, FileText, Flag, FolderOpen, Github, Globe, GraduationCap, Handshake, Heart, HelpCircle, Home, IdCard, ImageIcon, Instagram, Languages, LifeBuoy, Link, Mail, MapPin, MessageSquare, MousePointer2, Phone, Plus, RefreshCw, Search, Share2, Shield, Sigma, Square, CheckSquare, Target, TextCursor, User, Users, X
} from 'lucide-react';
import { FieldConfig, NotionType } from './types';

export const FIXED_FIELDS: FieldConfig[] = [
    { key: 'firstName', label: 'NOMBRES', icon: <User size={16} className="text-neutral-500" />, placeholder: 'Nombres' },
    { key: 'lastName', label: 'APELLIDOS', icon: <User size={16} className="text-neutral-500" />, placeholder: 'Apellidos' },
    { key: 'contactNumber', label: 'DIRECT LINE', icon: <Phone size={16} className="text-neutral-500" />, placeholder: 'Unmapped' },
    { key: 'email', label: 'DIGITAL MAIL', icon: <Mail size={16} className="text-neutral-500" />, placeholder: 'Not linked' },
];

export const OPTIONAL_FIELDS: FieldConfig[] = [
    // 0. Info Básica (Condicional)
    { key: 'website', label: 'GLOBAL WEB', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'No URL', section: 'Info Básica' },
    { key: 'company', label: 'ORGANIZATION', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'No disponible', section: 'Info Básica' },
    { key: 'address', label: 'GEOGRAPHIC LOCATION', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'No disponible', section: 'Info Básica' },
    { key: 'postalCode', label: 'POSTAL CODE', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Código Postal', section: 'Info Básica' },
    { key: 'contactName', label: 'NOMBRE COMPLETO (LEGACY)', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Nombre', section: 'Info Básica' },

    // 1. Estudiante
    { key: 'birthDate', label: 'FECHA DE NACIMIENTO', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha nac.', section: 'Estudiante' },
    { key: 'birthPlace', label: 'LUGAR DE NACIMIENTO', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Lugar', section: 'Estudiante' },
    { key: 'nationality', label: 'NACIONALIDAD', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'birthCity', label: 'CIUDAD (NACIMIENTO)', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Ciudad', section: 'Estudiante' },
    { key: 'birthCountry', label: 'PAÍS NAC.', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'birthState', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Provincia', section: 'Estudiante' },
    { key: 'hasOtherNationality', label: '¿OTRA NACIONALIDAD?', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Estudiante' },
    { key: 'otherNationalityCountry', label: '¿CUÁL?', icon: <Flag size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'isPermanentResidentOther', label: '¿RESIDENTE PERMANENTE DE OTRO PAÍS?', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Estudiante' },
    { key: 'permanentResidentCountry', label: '¿CUÁL?', icon: <Flag size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Estudiante' },
    { key: 'nationalId', label: 'NÚMERO DE IDENTIFICACIÓN NACIONAL (DNI/CURP)', icon: <IdCard size={18} className="text-neutral-500" />, placeholder: 'DNI/Cedula', section: 'Estudiante' },
    { key: 'maritalStatus', label: 'ESTADO CIVIL', icon: <Heart size={18} className="text-neutral-500" />, placeholder: 'Soltero/Casado', section: 'Estudiante' },
    { key: 'gender', label: 'GÉNERO', icon: <Target size={18} className="text-neutral-500" />, placeholder: 'H/M/O', section: 'Estudiante' },

    // 2. Pasaporte (Travel)
    { key: 'passportNumber', label: 'NÚMERO DE PASAPORTE', icon: <CreditCard size={18} className="text-neutral-500" />, placeholder: 'Pasaporte', section: 'Pasaporte' },
    { key: 'passportCountry', label: 'PAÍS DE EMISIÓN', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Pasaporte' },
    { key: 'passportCity', label: 'CIUDAD DE EMISIÓN', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Ciudad', section: 'Pasaporte' },
    { key: 'passportState', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Estado', section: 'Pasaporte' },
    { key: 'passportIssuedDate', label: 'FECHA DE EMISIÓN', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha', section: 'Pasaporte' },
    { key: 'passportExpiryDate', label: 'FECHA DE EXPIRACIÓN', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Expiración', section: 'Pasaporte' },
    { key: 'passportLost', label: '¿HAS PERDIDO TU PASAPORTE ALGUNA VEZ?', icon: <AlertCircle size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Pasaporte' },
    { key: 'hasTouristVisa', label: '¿TIENES VISA DE TURISTA ACTUAL?', icon: <CreditCard size={18} className="text-neutral-500" />, placeholder: '¿Tiene visa?', section: 'Pasaporte' },
    { key: 'visaIssuedDate', label: 'EMISIÓN VISA', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha', section: 'Pasaporte' },
    { key: 'visaExpiryDate', label: 'EXPIRACIÓN VISA', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Expiración visa', section: 'Pasaporte' },

    // 3. Dirección (Location)
    { key: 'city', label: 'CIUDAD', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Ciudad', section: 'Dirección' },
    { key: 'state', label: 'ESTADO/PROVINCIA', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Estado', section: 'Dirección' },
    { key: 'country', label: 'PAÍS', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Dirección' },

    { key: 'phone', label: 'TELÉFONO PERSONAL', icon: <Phone size={18} className="text-neutral-500" />, placeholder: 'Teléfono', section: 'Dirección' },
    { key: 'usAddress', label: 'DIRECCIÓN EN USA', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Hospedaje USA', section: 'Dirección' },

    // 4. Familia (Family)
    { key: 'hasSponsor', label: 'PATROCINADOR', icon: <Handshake size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Familia' },
    { key: 'sponsorFirstName', label: 'NOMBRE SPONSOR', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Nombre', section: 'Familia' },
    { key: 'sponsorLastName', label: 'APELLIDO SPONSOR', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Apellido', section: 'Familia' },
    { key: 'sponsorPhone', label: 'TELÉFONO SPONSOR', icon: <Phone size={18} className="text-neutral-500" />, placeholder: 'Teléfono', section: 'Familia' },
    { key: 'sponsorRelation', label: 'RELACIÓN SPONSOR', icon: <Users size={18} className="text-neutral-500" />, placeholder: 'Parentesco', section: 'Familia' },
    { key: 'motherName', label: 'NOMBRE MADRE', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Nombre madre', section: 'Familia' },
    { key: 'motherBirthDate', label: 'NAC. MADRE', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'fatherName', label: 'NOMBRE PADRE', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Nombre padre', section: 'Familia' },
    { key: 'fatherBirthDate', label: 'NAC. PADRE', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'spouseName', label: 'NOMBRE CÓNYUGE', icon: <User size={18} className="text-neutral-500" />, placeholder: 'Nombre', section: 'Familia' },
    { key: 'marriageDate', label: 'FECHA MATRIMONIO', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha', section: 'Familia' },
    { key: 'spouseBirthDate', label: 'NAC. CÓNYUGE', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha nac.', section: 'Familia' },
    { key: 'spouseCity', label: 'CIUDAD CÓNYUGE', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Ciudad', section: 'Familia' },
    { key: 'spouseCountry', label: 'PAÍS CÓNYUGE', icon: <Globe size={18} className="text-neutral-500" />, placeholder: 'País', section: 'Familia' },

    // 5. Empleo (Professional)
    { key: 'occupationData', label: 'ESTADO LABORAL', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Tipo empleo', section: 'Empleo' },
    { key: 'currentEmployer', label: 'EMPRESA ACTUAL', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Empresa', section: 'Empleo' },
    { key: 'employerAddress', label: 'DIRECCIÓN EMPRESA', icon: <MapPin size={18} className="text-neutral-500" />, placeholder: 'Dirección boss', section: 'Empleo' },
    { key: 'employerCity', label: 'CIUDAD EMPRESA', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Ciudad boss', section: 'Empleo' },
    { key: 'employerPhone', label: 'TELÉFONO EMPRESA', icon: <Phone size={18} className="text-neutral-500" />, placeholder: 'Tel. boss', section: 'Empleo' },
    { key: 'monthlySalary', label: 'SALARIO MENSUAL', icon: <CreditCard size={18} className="text-neutral-500" />, placeholder: 'Monto', section: 'Empleo' },
    { key: 'jobStartDate', label: 'INICIO EMPLEO', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Fecha inicio', section: 'Empleo' },
    { key: 'jobDescription', label: 'DESCRIPCIÓN ROL', icon: <FileText size={18} className="text-neutral-500" />, placeholder: 'Descripción', section: 'Empleo' },
    { key: 'otherIncomeSource', label: 'OTROS INGRESOS', icon: <DollarSign size={18} className="text-neutral-500" />, placeholder: 'Fuentes extra', section: 'Empleo' },
    { key: 'hasPreviousJob', label: '¿EMPLEO ANTERIOR?', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Empleo' },
    { key: 'prevEmployer', label: 'EMPRESA ANTERIOR', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Ex-empresa', section: 'Empleo' },
    { key: 'prevJobTitle', label: 'CARGO ANTERIOR', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Ex-cargo', section: 'Empleo' },
    { key: 'profession', label: 'PROFESIÓN', icon: <Briefcase size={18} className="text-neutral-500" />, placeholder: 'Profesión base', section: 'Empleo' },

    // 6. Estudios (Education)
    { key: 'schoolName', label: 'SECUNDARIA', icon: <GraduationCap size={18} className="text-neutral-500" />, placeholder: 'Colegio', section: 'Estudios' },
    { key: 'schoolProgram', label: 'PROGRAMA SEC.', icon: <FileText size={18} className="text-neutral-500" />, placeholder: 'Programa', section: 'Estudios' },
    { key: 'universityName', label: 'UNIVERSIDAD', icon: <GraduationCap size={18} className="text-neutral-500" />, placeholder: 'Universidad', section: 'Estudios' },
    { key: 'universityProgram', label: 'CARRERA UNI.', icon: <FileText size={18} className="text-neutral-500" />, placeholder: 'Programa', section: 'Estudios' },

    // 7. Antecedentes (Background)
    { key: 'studyReason', label: 'RAZÓN ESTUDIO', icon: <FileText size={18} className="text-neutral-500" />, placeholder: '¿Por qué estudiar?', section: 'Antecedentes' },
    { key: 'studyDuration', label: 'TIEMPO ESTUDIO', icon: <Clock size={18} className="text-neutral-500" />, placeholder: 'Duración', section: 'Antecedentes' },
    { key: 'startSemester', label: 'SEMESTRE INICIO', icon: <Calendar size={18} className="text-neutral-500" />, placeholder: 'Enero/Mayo/Sept', section: 'Antecedentes' },
    { key: 'preferredSchedule', label: 'HORARIO PREF.', icon: <Clock size={18} className="text-neutral-500" />, placeholder: 'Mañana/Tarde/Noche', section: 'Antecedentes' },
    { key: 'targetSchool', label: 'ESCUELA DESTINO', icon: <Building size={18} className="text-neutral-500" />, placeholder: 'Escuela', section: 'Antecedentes' },
    { key: 'visaRefusal', label: 'RECHAZO VISA', icon: <AlertCircle size={18} className="text-neutral-500" />, placeholder: '¿Tiene rechazos?', section: 'Antecedentes' },
    { key: 'militaryService', label: 'SERVICIO MILITAR', icon: <Shield size={18} className="text-neutral-500" />, placeholder: 'Sí/No', section: 'Antecedentes' },
    { key: 'languages', label: 'IDIOMAS', icon: <Languages size={18} className="text-neutral-500" />, placeholder: 'Español, Inglés...', section: 'Antecedentes' },
    { key: 'allergies', label: 'ALERGIAS', icon: <Activity size={18} className="text-neutral-500" />, placeholder: 'Alergias', section: 'Antecedentes' },
    { key: 'medicalConditions', label: 'CONDICIONES MÉDICAS', icon: <Activity size={18} className="text-neutral-500" />, placeholder: 'Condiciones', section: 'Antecedentes' },
];

export const NOTION_TYPES: NotionType[] = [
    // Propiedades Básicas
    { id: 'text', label: 'Texto', icon: <FileText size={14} className="text-neutral-500" /> },
    { id: 'number', label: 'Número', icon: <span className="font-bold text-[10px] text-neutral-500">#</span> },
    { id: 'select', label: 'Seleccionar', icon: <ChevronDown size={14} className="text-neutral-500" /> },
    { id: 'multiselect', label: 'Selección múltiple', icon: <Users size={14} className="text-neutral-500" /> },
    { id: 'status', label: 'Estado', icon: <Clock size={14} className="text-neutral-500" /> },
    { id: 'date', label: 'Fecha', icon: <Calendar size={14} className="text-neutral-500" /> },
    { id: 'people', label: 'Personas', icon: <User size={14} className="text-neutral-500" /> },
    { id: 'files', label: 'Archivos', icon: <ImageIcon size={14} className="text-neutral-500" /> },
    { id: 'checkbox', label: 'Casilla', icon: <CheckSquare size={14} className="text-neutral-500" /> },
    { id: 'url', label: 'URL', icon: <Link size={14} className="text-neutral-500" /> },
    { id: 'email', label: 'Correo', icon: <Mail size={14} className="text-neutral-500" /> },
    { id: 'phone', label: 'Teléfono', icon: <Phone size={14} className="text-neutral-500" /> },

    // Avanzado
    { id: 'formula', label: 'Fórmula', icon: <Sigma size={14} className="text-neutral-500" />, category: 'Avanzado' },
    { id: 'relation', label: 'Relación', icon: <ArrowUpRight size={14} className="text-neutral-500" />, category: 'Avanzado' },
    { id: 'rollup', label: 'Rollup', icon: <Search size={14} className="text-neutral-500" />, category: 'Avanzado' },
    { id: 'id', label: 'ID', icon: <IdCard size={14} className="text-neutral-500" />, category: 'Avanzado' },
];

export const STATUS_OPTIONS = [
    { id: 'sin-empezar', label: 'Sin empezar', color: 'bg-neutral-800 text-neutral-400 border-neutral-700/50', category: 'Pendiente', dotColor: 'bg-neutral-600' },
    { id: 'en-curso', label: 'En curso', color: 'bg-neutral-700 text-neutral-300 border-neutral-600/50', category: 'En curso', dotColor: 'bg-neutral-400' },
    { id: 'listo', label: 'Listo', color: 'bg-neutral-600 text-neutral-200 border-neutral-500/50', category: 'Completado', dotColor: 'bg-neutral-200' },
];

export const AVAILABLE_ICONS = [
    { name: 'FileText', icon: <FileText /> },
    { name: 'Hash', icon: <span className="font-bold text-[10px]">#</span> },
    { name: 'Activity', icon: <Activity /> },
    { name: 'Search', icon: <Search /> },
    { name: 'Clock', icon: <Clock /> },
    { name: 'Calendar', icon: <Calendar /> },
    { name: 'Users', icon: <Users /> },
    { name: 'ImageIcon', icon: <ImageIcon /> },
    { name: 'CheckCircle', icon: <CheckCircle /> },
    { name: 'Link', icon: <Link /> },
    { name: 'Mail', icon: <Mail /> },
    { name: 'Phone', icon: <Phone /> },
    { name: 'MapPin', icon: <MapPin /> },
    { name: 'CreditCard', icon: <CreditCard /> },
    { name: 'Briefcase', icon: <Briefcase /> },
    { name: 'GraduationCap', icon: <GraduationCap /> },
    { name: 'Heart', icon: <Heart /> },
    { name: 'Globe', icon: <Globe /> },
    { name: 'Building', icon: <Building /> },
    { name: 'Shield', icon: <Shield size={14} /> },
    { name: 'Target', icon: <Target size={14} /> },
    { name: 'Instagram', icon: <Instagram size={14} /> },
    { name: 'Facebook', icon: <Facebook size={14} /> },
    { name: 'Github', icon: <Github size={14} /> },
    { name: 'Globe', icon: <Globe size={14} /> },
];
