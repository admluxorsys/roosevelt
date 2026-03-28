'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  List, Paperclip, Upload, FileText, Loader2, Check, ChevronDown, ExternalLink, Link, 
  MessageCircle, Instagram, Facebook, Globe2
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactPanelProps {
    card: any;
    groups: any[];
}

// ─── Color options for badges ───────────────────────────────────────────────
const BADGE_COLORS: Record<string, string> = {
  green:  'bg-green-900/60 text-green-300 border border-green-700/40',
  olive:  'bg-yellow-900/60 text-yellow-300 border border-yellow-700/40',
  blue:   'bg-blue-900/60  text-blue-300  border border-blue-700/40',
  purple: 'bg-purple-900/60 text-purple-300 border border-purple-700/40',
  red:    'bg-red-900/60   text-red-300   border border-red-700/40',
  gray:   'bg-neutral-800  text-neutral-300 border border-neutral-700',
};

const BADGE_OPTIONS = ['Nuevo Aplicante', 'En Proceso', 'Aprobado', 'Rechazado', 'Pendiente'];

// ─── Static document fields ──────────────────────────────────────────────────
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

function FileRow({
  label, fieldKey, cardId, groupId, url,
}: { label: string; fieldKey: string; cardId: string; groupId: string; url?: string }) {
  const { currentUser, activeEntity } = useAuth();
  const getTenantPath = () => {
    if (!currentUser?.uid || !activeEntity) return '';
    return `users/${currentUser.uid}/entities/${activeEntity}`;
  };
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
      await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, groupId, 'cards', cardId), {
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
      <span className="w-40 text-[12px] text-neutral-500 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center justify-end gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[11px] text-neutral-200 hover:bg-neutral-700 transition-colors max-w-[120px] truncate"
          >
            <FileText size={10} />
            <span className="truncate">{label.slice(0, 15)}...</span>
            <ExternalLink size={9} className="flex-shrink-0" />
          </a>
        ) : (
          <span className="text-[12px] text-neutral-700 italic">Vacío</span>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded hover:bg-white/5 text-neutral-600 hover:text-neutral-300"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function ContactPanel({ card, groups }: ContactPanelProps) {
  const { currentUser, activeEntity } = useAuth();
  const getTenantPath = () => {
    if (!currentUser?.uid || !activeEntity) return '';
    return `users/${currentUser.uid}/entities/${activeEntity}`;
  };

  const [liveData, setLiveData]           = useState<any>(null);
  const [contactData, setContactData]     = useState<any>(null);
  const [editingName, setEditingName]     = useState(false);
  const [nameValue, setNameValue]         = useState('');

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  useEffect(() => {
     if (card?.id) setCurrentId(card.id);
     if (card?.groupId) setCurrentGroupId(card.groupId);
  }, [card]);

  useEffect(() => {
    if (!currentId || !currentGroupId) return;
    return onSnapshot(
      doc(db, `${getTenantPath()}/kanban-groups`, currentGroupId, 'cards', currentId),
      snap => { if (snap.exists()) setLiveData({ id: snap.id, ...snap.data() }); }
    );
  }, [currentId, currentGroupId]);

  useEffect(() => {
    const crmId = liveData?.crmId || card?.crmId;
    if (!crmId) { setContactData(null); return; }
    return onSnapshot(
      doc(db, `${getTenantPath()}/contacts`, crmId),
      snap => { if (snap.exists()) setContactData({ id: snap.id, ...snap.data() }); }
    );
  }, [liveData?.crmId, card?.crmId]);

  useEffect(() => {
    const base = liveData || card || {};
    setNameValue(base.contactName || '');
  }, [liveData?.id, card?.id]);

  const update = async (fields: Record<string, any>) => {
    if (!currentId || !currentGroupId) return;
    try {
      await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, currentGroupId, 'cards', currentId), fields);
    } catch { toast.error('Error al guardar'); }
  };

  useEffect(() => {
    if (!currentId || !currentGroupId || !liveData || liveData.crmId) return;
    const generate = async () => {
      try {
        const counterRef = doc(db, `${getTenantPath()}/system_metadata`, 'counters');
        let numericId = '';
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(counterRef);
          const next = (snap.exists() ? (snap.data().crmIdCount || 0) : 0) + 1;
          tx.set(counterRef, { crmIdCount: next }, { merge: true });
          numericId = String(next).padStart(10, '0');
        });
        await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, currentGroupId, 'cards', currentId), { crmId: numericId });
        await setDoc(doc(db, `${getTenantPath()}/contacts`, numericId), {
          crmId: numericId,
          contactName: liveData.contactName || '',
          contactNumber: liveData.contactNumber || '',
          kanbanGroupId: currentGroupId,
          kanbanCardId: currentId,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) { console.error('Error ID:', err); }
    };
    generate();
  }, [liveData, currentId, currentGroupId]);

  const handleCopyLink = () => {
    const crmId = liveData?.crmId || card?.crmId;
    if (!crmId) return;
    const link = `${window.location.origin}/application/${crmId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  if (!card) {
      return (
          <div className="w-[420px] bg-black border-l border-white/[0.07] flex flex-col h-full flex-shrink-0 items-center justify-center">
              <span className="text-neutral-600 text-sm">Selecciona una conversación</span>
          </div>
      );
  }

  const base = liveData || card || {};
  const data = {
    ...base,
    contactName: base.contactName || (contactData?.firstName ? `${contactData.firstName} ${contactData.lastName || ''}` : ''),
  };

  return (
    <div className="w-[420px] bg-black border-l border-white/[0.07] flex flex-col h-full flex-shrink-0">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="flex items-center gap-3 flex-wrap mb-8">
          {(() => {
            const c = (data.channel || data.source || '').toLowerCase();
            if (c.includes('instagram')) return <Instagram size={22} className="text-pink-500" />;
            if (c.includes('messenger') || c.includes('facebook')) return <Facebook size={22} className="text-blue-600" />;
            if (c.includes('web')) return <Globe2 size={22} className="text-cyan-400" />;
            return <MessageCircle size={22} className="text-emerald-500" />;
          })()}

          {editingName ? (
            <input autoFocus value={nameValue} onChange={e => setNameValue(e.target.value)}
              onBlur={() => { setEditingName(false); update({ contactName: nameValue }); }}
              className="bg-transparent text-white text-[24px] font-bold outline-none border-b border-white/20 flex-1" />
          ) : (
            <h1 onClick={() => setEditingName(true)} className="text-[24px] font-bold text-white cursor-text hover:bg-white/[0.03] rounded px-1 -mx-1 truncate max-w-[200px]">
              {data.contactName || <span className="text-neutral-600 italic">Sin nombre</span>}
            </h1>
          )}

          {data.crmId ? (
            <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-500 hover:text-neutral-300 text-[10px] font-mono ml-auto">
              <Link size={10} /> #{data.crmId}
            </button>
          ) : (
            <span className="text-[10px] text-neutral-700 font-mono ml-auto">Generando...</span>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3">
            <List size={14} className="text-neutral-600" />
            <span className="w-32 text-[12px] text-neutral-500">Status</span>
            <BadgeSelect value={data.status || 'Nuevo Aplicante'} options={BADGE_OPTIONS} color="green" onChange={v => update({ status: v })} />
          </div>
          
          <div className="py-3"><div className="h-[1px] bg-white/[0.05]" /></div>
          
          {DOC_FIELDS.map(field => (
            <FileRow key={field.key} label={field.label} fieldKey={field.key} cardId={data.id} groupId={data.groupId} url={data.documents?.[field.key]?.url} />
          ))}
        </div>
      </div>
    </div>
  );
}

