'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, List, Calendar, Paperclip, CheckSquare, AlignLeft, Plus, Upload,
  FileText, File, Loader2, Check, ChevronDown, ExternalLink, Link, Copy,
  MessageCircle, Instagram, Facebook, Globe2
} from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

export interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: any;
  groupName?: string;
  groups?: any[];
  allConversations?: any[];
  onSelectConversation?: (card: any) => void;
  stats?: { totalConversations: number; totalGroups: number };
}

// ─── Badge color options ──────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  green:  'bg-green-900/60 text-green-300 border border-green-700/40',
  olive:  'bg-yellow-900/60 text-yellow-300 border border-yellow-700/40',
  blue:   'bg-blue-900/60  text-blue-300  border border-blue-700/40',
  purple: 'bg-purple-900/60 text-purple-300 border border-purple-700/40',
  red:    'bg-red-900/60   text-red-300   border border-red-700/40',
  gray:   'bg-neutral-800  text-neutral-300 border border-neutral-700',
};

// ─── Static document fields ───────────────────────────────────────────────────
const DOC_FIELDS = [
  { key: 'photo',            label: 'PHOTO' },
  { key: 'excel',            label: 'EXCEL' },
  { key: 'pasaporte',        label: 'PASAPORTE' },
  { key: 'ds160Estudiar',    label: 'DS 160 – ESTUDIAR' },
  { key: 'ds160',            label: 'DS 160' },
  { key: 'bankStatement',    label: 'BANK STATEMENT' },
  { key: 'tarifaSevis',      label: 'TARIFA SEVIS' },
  { key: 'reciboCita',       label: 'RECIBO CITA' },
  { key: 'instrucciones',    label: 'INSTRUCCIONES' },
  { key: 'i20CartaAceptacion', label: 'I20 y Carta de Aceptación' },
  { key: 'visaTurista',      label: 'VISA TURISTA' },
  { key: 'edicionI20',       label: 'Edicion I20' },
  { key: 'idPatrocinador',   label: 'ID del Patrocinador' },
];

// ─── Badge selector popup ─────────────────────────────────────────────────────
const BADGE_OPTIONS = ['Nuevo Aplicante', 'En Proceso', 'Aprobado', 'Rechazado', 'Pendiente'];
const SCHOOL_OPTIONS = ['Lumos', 'KAPLAN', 'EF', 'EC', 'Otro'];
const STATE_OPTIONS  = ['Primer Intento', 'Segundo Intento', 'Tercer Intento'];

function BadgeSelect({
  value, options, color, onChange,
}: { value: string; options: string[]; color: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold ${BADGE_COLORS[color]} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        {value || 'Sin valor'}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-[#111] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12px] hover:bg-white/5 transition-colors flex items-center justify-between ${value === opt ? 'text-white' : 'text-neutral-400'}`}
            >
              {opt}
              {value === opt && <Check size={11} className="text-emerald-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File upload row ──────────────────────────────────────────────────────────
function FileRow({
  label, fieldKey, cardId, groupId, url,
}: { label: string; fieldKey: string; cardId: string; groupId: string; url?: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cardId || !groupId) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `cards/${cardId}/${fieldKey}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'kanban-groups', groupId, 'cards', cardId), {
        [`documents.${fieldKey}`]: { url: downloadURL, name: file.name },
      });
      toast.success(`${label} subido`);
    } catch {
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center group px-4 py-2 hover:bg-white/[0.03] transition-colors rounded-lg gap-3 min-h-[36px]">
      <Paperclip size={14} className="text-neutral-600 flex-shrink-0" />
      <span className="w-44 text-[12px] text-neutral-500 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[11px] text-neutral-200 hover:bg-neutral-700 transition-colors max-w-[180px] truncate"
          >
            <FileText size={10} />
            <span className="truncate">{label.slice(0, 20)}...</span>
            <ExternalLink size={9} className="flex-shrink-0" />
          </a>
        ) : (
          <span className="text-[12px] text-neutral-700 italic">Vacío</span>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 rounded hover:bg-white/5 text-neutral-600 hover:text-neutral-300"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ConversationModal({
  isOpen, onClose, card, groupName,
}: ConversationModalProps) {
  const [liveData, setLiveData]           = useState<any>(null);
  const [contactData, setContactData]     = useState<any>(null); // from contacts/{crmId}
  const [editingName, setEditingName]     = useState(false);
  const [nameValue, setNameValue]         = useState('');
  const [editingComment, setEditingComment] = useState(false);
  const [commentValue, setCommentValue]   = useState('');
  const [editingDate, setEditingDate]     = useState(false);
  const [dateValue, setDateValue]         = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  // Real-time listener
  useEffect(() => {
    if (!card?.id || !card?.groupId || !isOpen) return;
    const unsub = onSnapshot(
      doc(db, 'kanban-groups', card.groupId, 'cards', card.id),
      snap => { if (snap.exists()) setLiveData({ id: snap.id, ...snap.data() }); }
    );
    return () => unsub();
  }, [card?.id, card?.groupId, isOpen]);

  // Real-time listener for the contacts document (application form data)
  useEffect(() => {
    const crmId = liveData?.crmId;
    if (!crmId || !isOpen) { setContactData(null); return; }
    const unsub = onSnapshot(
      doc(db, 'contacts', crmId),
      snap => { if (snap.exists()) setContactData({ id: snap.id, ...snap.data() }); }
    );
    return () => unsub();
  }, [liveData?.crmId, isOpen]);

  // Sync editable fields when liveData loads
  useEffect(() => {
    if (!liveData) return;
    setNameValue(liveData.contactName || '');
    setCommentValue(liveData.comments || '');
    setDateValue(liveData.fecha || '');
  }, [liveData?.id]);

  const update = async (fields: Record<string, any>) => {
    if (!card?.id || !card?.groupId) return;
    try {
      await updateDoc(doc(db, 'kanban-groups', card.groupId, 'cards', card.id), fields);
    } catch { toast.error('Error al guardar'); }
  };

  // ── Auto-generate crmId as soon as liveData confirms no ID exists ─────────
  useEffect(() => {
    if (!isOpen || !card?.id || !card?.groupId) return;
    if (!liveData) return;           // Wait until Firestore data arrives
    if (liveData.crmId) return;      // Already has an ID — do nothing

    const autoGenerateId = async () => {
      try {
        const counterRef = doc(db, 'counters', 'crmId');
        let numericId = '';

        await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          const currentCount = counterSnap.exists() ? (counterSnap.data().count || 0) : 0;
          const nextCount = currentCount + 1;
          transaction.set(counterRef, { count: nextCount }, { merge: true });
          numericId = String(nextCount).padStart(10, '0');
        });

        await updateDoc(doc(db, 'kanban-groups', card.groupId, 'cards', card.id), {
          crmId: numericId
        });

        await setDoc(doc(db, 'contacts', numericId), {
          crmId: numericId,
          contactName: liveData.contactName || '',
          contactNumber: liveData.contactNumber || '',
          email: liveData.email || '',
          kanbanGroupId: card.groupId,
          kanbanCardId: card.id,
          createdAt: new Date().toISOString(),
        }, { merge: true });

      } catch (err) {
        console.error('Error auto-generating crmId:', err);
      }
    };

    autoGenerateId();
  }, [liveData, isOpen, card?.id]);


  const handleCopyLink = () => {
    const crmId = (liveData || card)?.crmId;
    if (!crmId) return;
    const link = `${window.location.origin}/suite/coo/kamban/application/${crmId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    window.open(link, '_blank');
    toast.success('Link copiado y abierto');
  };


  if (!isOpen) return null;

  // ── Merge kamban card + application form data ──────────────────────────────
  const base = liveData || card || {};
  const data = {
    ...base,
    // Name: prefer kamban, fallback to form firstName+lastName
    contactName: base.contactName
      || (contactData?.firstName && contactData?.lastName
        ? `${contactData.firstName} ${contactData.lastName}`
        : contactData?.firstName || contactData?.lastName || ''),
    // Badge fields: prefer kamban, fallback to application form
    escuela:  base.escuela  || contactData?.selectedSchool || '',
    estado:   base.estado   || contactData?.visaType       || '',
    fecha:    base.fecha    || contactData?.birthDate      || '',
    // Extra fields from application form shown as read-only rows
    phone:       contactData?.phone       || base.contactNumber || '',
    email:       contactData?.email       || base.email         || '',
    passportNum: contactData?.passportNumber || '',
    passportExp: contactData?.passportExpiryDate || '',
    nationality: contactData?.country     || '',
    cedula:      contactData?.nationalId  || '',
    comments:    base.comments || contactData?.comments    || '',
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 pointer-events-auto backdrop-blur-[3px]"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="absolute top-0 right-0 h-full w-1/2 bg-black border-l border-white/[0.07] shadow-[-24px_0_60px_rgba(0,0,0,0.7)] flex flex-col pointer-events-auto"
      >
        {/* ── Top bar ─────────────────────────────────────────── */}
        <header className="h-12 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2 text-neutral-600">
            <button className="p-1.5 hover:text-neutral-300 hover:bg-white/5 rounded transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
            </button>
            <button className="p-1.5 hover:text-neutral-300 hover:bg-white/5 rounded transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-600 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* ── Scrollable content ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-10">

            {/* Title */}
            <div className="mb-8">
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const c = (data.channel || data.source || '').toLowerCase();
                  if (c.includes('instagram')) return <Instagram size={18} className="text-pink-500" />;
                  if (c.includes('messenger') || c.includes('facebook')) return <Facebook size={18} className="text-blue-600" />;
                  if (c.includes('web')) return <Globe2 size={18} className="text-cyan-400" />;
                  return <MessageCircle size={18} className="text-emerald-500" />;
                })()}

                {editingName ? (
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onBlur={() => { setEditingName(false); update({ contactName: nameValue }); }}
                    onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); update({ contactName: nameValue }); } }}
                    className="bg-transparent text-white text-[28px] font-bold outline-none border-b border-white/20 pb-1 flex-1"
                  />
                ) : (
                  <h1
                    onClick={() => setEditingName(true)}
                    className="text-[28px] font-bold text-white cursor-text hover:bg-white/[0.03] rounded px-1 -mx-1 transition-colors"
                  >
                    {data.contactName || <span className="text-neutral-600 italic font-normal">Sin nombre</span>}
                  </h1>
                )}

                {/* CRM ID badge */}
                {data.crmId ? (
                  <button
                    onClick={handleCopyLink}
                    title="Click para copiar link de aplicación"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-500 hover:text-neutral-300 hover:border-white/20 transition-all text-[11px] font-mono"
                  >
                    <Link size={10} />
                    #{data.crmId}
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] text-neutral-700 font-mono">
                    <Loader2 size={10} className="animate-spin" />
                    generando id...
                  </span>
                )}
              </div>
            </div>


            {/* ── Properties ──────────────────────────────────── */}
            <div className="space-y-0.5">

              {/* Status (badge) */}
              <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px]">
                <List size={14} className="text-neutral-600 flex-shrink-0" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0"></span>
                <BadgeSelect
                  value={data.status || 'Nuevo Aplicante'}
                  options={BADGE_OPTIONS}
                  color="green"
                  onChange={v => update({ status: v })}
                />
              </div>

              {/* Escuela */}
              <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px]">
                <List size={14} className="text-neutral-600 flex-shrink-0" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0">Escuela</span>
                <BadgeSelect
                  value={data.escuela || ''}
                  options={SCHOOL_OPTIONS}
                  color="olive"
                  onChange={v => update({ escuela: v })}
                />
              </div>

              {/* Estado */}
              <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px]">
                <List size={14} className="text-neutral-600 flex-shrink-0" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0">Estado</span>
                <BadgeSelect
                  value={data.estado || ''}
                  options={STATE_OPTIONS}
                  color="green"
                  onChange={v => update({ estado: v })}
                />
              </div>

              {/* Fecha */}
              <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px] group">
                <Calendar size={14} className="text-neutral-600 flex-shrink-0" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0">Fecha</span>
                {editingDate ? (
                  <input
                    autoFocus type="date"
                    value={dateValue}
                    onChange={e => setDateValue(e.target.value)}
                    onBlur={() => { setEditingDate(false); update({ fecha: dateValue }); }}
                    className="bg-transparent text-[12px] text-white border-b border-white/20 outline-none"
                  />
                ) : (
                  <span
                    onClick={() => setEditingDate(true)}
                    className={`text-[12px] cursor-text ${data.fecha ? 'text-neutral-200' : 'text-neutral-700 italic'}`}
                  >
                    {data.fecha || 'Vacío'}
                  </span>
                )}
              </div>

              {/* ── Divider ─────────────────────────────────── */}
              <div className="py-2"><div className="h-[1px] bg-white/[0.05]" /></div>

              {/* Document uploads */}
              {DOC_FIELDS.map(field => (
                <FileRow
                  key={field.key}
                  label={field.label}
                  fieldKey={field.key}
                  cardId={data.id || card?.id}
                  groupId={data.groupId || card?.groupId}
                  url={data.documents?.[field.key]?.url}
                />
              ))}

              {/* ── Divider ─────────────────────────────────── */}
              <div className="py-2"><div className="h-[1px] bg-white/[0.05]" /></div>

              {/* Lista Comisión (checkbox) */}
              <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px]">
                <CheckSquare size={14} className="text-neutral-600 flex-shrink-0" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0">Lista Comisión</span>
                <button
                  onClick={() => update({ listaComision: !data.listaComision })}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    data.listaComision
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'border-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {data.listaComision && <Check size={10} className="text-white" strokeWidth={3} />}
                </button>
              </div>

              {/* Comments */}
              <div className="flex items-start px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3 min-h-[36px]">
                <AlignLeft size={14} className="text-neutral-600 flex-shrink-0 mt-0.5" />
                <span className="w-44 text-[12px] text-neutral-500 flex-shrink-0 pt-0.5">Comments</span>
                <div className="flex-1">
                  {editingComment ? (
                    <textarea
                      autoFocus
                      value={commentValue}
                      onChange={e => setCommentValue(e.target.value)}
                      onBlur={() => { setEditingComment(false); update({ comments: commentValue }); }}
                      rows={4}
                      className="w-full bg-transparent text-[12px] text-neutral-200 outline-none resize-none border-b border-white/10 pb-1"
                      placeholder="Escribe un comentario..."
                    />
                  ) : (
                    <span
                      onClick={() => setEditingComment(true)}
                      className={`text-[12px] cursor-text block ${data.comments ? 'text-neutral-200' : 'text-neutral-700 italic'}`}
                    >
                      {data.comments || 'Vacío'}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Add property */}
            <button className="flex items-center gap-2 px-4 py-2 mt-4 text-neutral-700 hover:text-neutral-400 hover:bg-white/[0.03] rounded-lg transition-colors text-[12px]">
              <Plus size={14} />
              Agregar una propiedad
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
