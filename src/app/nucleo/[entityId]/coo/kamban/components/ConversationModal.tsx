'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, List, Calendar, Paperclip, CheckSquare, AlignLeft, Plus, Upload, Trash2,
  FileText, File, Loader2, Check, ChevronDown, ExternalLink, Link, Copy,
  MessageCircle, Instagram, Facebook, Globe2
} from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, runTransaction, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
export interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: any;
  groupName?: string;
  groups?: any[];
  allConversations?: any[];
  onSelectConversation?: (card: any) => void;
  stats?: { totalConversations: number; totalGroups: number };
  isGlobalContact?: boolean;
  hideSidebar?: boolean;
  hideInternalTray?: boolean;
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
const SCHOOL_OPTIONS = ['Lumos', 'KAPLAN', 'EF', 'EC', 'Otro'];
const STATE_OPTIONS  = ['Primer Intento', 'Segundo Intento', 'Tercer Intento'];

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
  label, fieldKey, cardId, groupId, fileData, allowMultiple
}: { label: string; fieldKey: string; cardId: string; groupId: string; fileData?: any; allowMultiple?: boolean }) {
  const { currentUser, activeEntity } = useAuth();
  const getTenantPath = () => {
    if (!currentUser?.uid || !activeEntity) return '';
    return `users/${currentUser.uid}/entities/${activeEntity}`;
  };
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = Array.isArray(fileData) ? fileData : (fileData?.url ? [fileData] : []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length || !cardId || !groupId) return;
    setUploading(true);
    try {
      const newFiles = allowMultiple ? [...files] : [];
      let lastFile: any = null;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const storagePath = `uploads/${currentUser?.uid}/entities/${activeEntity}/cards/${cardId}/${fieldKey}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        const fileObj = { url: downloadURL, name: file.name };
        newFiles.push(fileObj);
        lastFile = fileObj;
      }

      await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, groupId, 'cards', cardId), {
        [`documents.${fieldKey}`]: allowMultiple ? newFiles : lastFile,
      });
      toast.success(`${label} subido(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (index?: number) => {
    if (!confirm(`¿Seguro que quieres eliminar el archivo?`)) return;
    try {
      if (allowMultiple && index !== undefined) {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, groupId, 'cards', cardId), {
          [`documents.${fieldKey}`]: newFiles.length > 0 ? newFiles : deleteField(),
        });
      } else {
        await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, groupId, 'cards', cardId), {
          [`documents.${fieldKey}`]: deleteField(),
        });
      }
      toast.success(`Archivo eliminado`);
    } catch {
      toast.error('Error al eliminar archivo');
    }
  };

  return (
    <div className="flex min-h-[36px] items-center group px-4 py-2 hover:bg-white/[0.03] transition-colors rounded-lg gap-3">
      <Paperclip size={14} className="text-neutral-600 flex-shrink-0" />
      <span className="w-44 text-[12px] text-neutral-500 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-2">
        {files.length > 0 ? (
          files.map((f, i) => (
            <div key={i} className="flex items-center gap-1 group/file">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[11px] text-neutral-200 hover:bg-neutral-700 transition-colors max-w-[170px] truncate"
              >
                <FileText size={10} />
                <span className="truncate">{f.name ? f.name.slice(0, 20) : 'Archivo'}</span>
                <ExternalLink size={9} className="flex-shrink-0" />
              </a>
              <button
                 onClick={(e) => { e.preventDefault(); handleDelete(i); }}
                 className="p-1 rounded opacity-0 group-hover/file:opacity-100 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all"
                 title="Eliminar archivo"
              >
                <X size={12} />
              </button>
            </div>
          ))
        ) : (
          <span className="text-[12px] text-neutral-700 italic">Vacío</span>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-1">
          {files.length > 0 && !allowMultiple && (
            <button
               onClick={() => handleDelete()}
               className="p-1 rounded hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-colors"
               title="Eliminar todo"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            className="p-1 rounded hover:bg-white/5 text-neutral-600 hover:text-neutral-300 transition-colors"
            title={files.length > 0 ? (allowMultiple ? "Subir más" : "Reemplazar") : "Subir archivo"}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : (allowMultiple ? <Plus size={13} /> : <Upload size={13} />)}
          </button>
        </div>
        <input 
          ref={inputRef} 
          type="file" 
          multiple={allowMultiple}
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,video/*"
          className="hidden" 
          onChange={handleFile} 
        />
      </div>
    </div>
  );
}

export default function ConversationModal({
  isOpen, onClose, card,
}: ConversationModalProps) {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

  const [liveData, setLiveData]           = useState<any>(null);
  const [contactData, setContactData]     = useState<any>(null);
  const [editingName, setEditingName]     = useState(false);
  const [nameValue, setNameValue]         = useState('');
  const [editingComment, setEditingComment] = useState(false);
  const [commentValue, setCommentValue]   = useState('');
  const [editingDate, setEditingDate]     = useState(false);
  const [dateValue, setDateValue]         = useState('');

  useEffect(() => {
    if (!card?.id || !card?.groupId || !isOpen) return;
    return onSnapshot(
      doc(db, `${getTenantPath()}/kanban-groups`, card.groupId, 'cards', card.id),
      snap => { if (snap.exists()) setLiveData({ id: snap.id, ...snap.data() }); }
    );
  }, [card?.id, card?.groupId, isOpen]);

  useEffect(() => {
    const crmId = liveData?.crmId;
    if (!crmId || !isOpen) { setContactData(null); return; }
    return onSnapshot(
      doc(db, `${getTenantPath()}/contacts`, crmId),
      snap => { if (snap.exists()) setContactData({ id: snap.id, ...snap.data() }); }
    );
  }, [liveData?.crmId, isOpen]);

  useEffect(() => {
    if (!liveData) return;
    setNameValue(liveData.contactName || '');
    setCommentValue(liveData.comments || '');
    setDateValue(liveData.fecha || '');
  }, [liveData?.id]);

  const update = async (fields: Record<string, any>) => {
    if (!card?.id || !card?.groupId) return;
    try {
      await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, card.groupId, 'cards', card.id), fields);
    } catch { toast.error('Error al guardar'); }
  };

  useEffect(() => {
    if (!isOpen || !card?.id || !card?.groupId || !liveData || liveData.crmId) return;
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
        await updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, card.groupId, 'cards', card.id), { crmId: numericId });
        await setDoc(doc(db, `${getTenantPath()}/contacts`, numericId), {
          crmId: numericId,
          contactName: liveData.contactName || '',
          contactNumber: liveData.contactNumber || '',
          kanbanGroupId: card.groupId,
          kanbanCardId: card.id,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) { console.error('Error ID:', err); }
    };
    generate();
  }, [liveData, isOpen]);

  const handleCopyLink = () => {
    const crmId = liveData?.crmId;
    if (!crmId) return;
    const link = `${window.location.origin}/nucleo/roosevelt/coo/kamban/application/${crmId}`;
    navigator.clipboard.writeText(link);
    window.open(link, '_blank');
    toast.success('Link copiado');
  };

  if (!isOpen) return null;

  const base = liveData || card || {};
  const data = {
    ...base,
    contactName: base.contactName || (contactData?.firstName ? `${contactData.firstName} ${contactData.lastName || ''}` : ''),
    escuela:  base.escuela  || contactData?.selectedSchool || '',
    estado:   base.estado   || contactData?.visaType       || '',
    fecha:    base.fecha    || contactData?.birthDate      || '',
    comments: base.comments || contactData?.comments       || '',
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
        className="absolute inset-0 bg-black/50 pointer-events-auto backdrop-blur-[3px]" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 28 }}
        className="absolute top-0 right-0 h-full w-1/2 bg-black border-l border-white/[0.07] flex flex-col pointer-events-auto">
        <header className="h-12 flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex gap-2">
            <button onClick={onClose} className="p-1.5 text-neutral-600 hover:text-white rounded"><X size={16} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-10">
          <div className="flex items-center gap-3 flex-wrap mb-8">
            {(() => {
              const c = (data.channel || data.source || '').toLowerCase();
              if (c.includes('instagram')) return <Instagram size={18} className="text-pink-500" />;
              if (c.includes('messenger') || c.includes('facebook')) return <Facebook size={18} className="text-blue-600" />;
              if (c.includes('web')) return <Globe2 size={18} className="text-cyan-400" />;
              return <MessageCircle size={18} className="text-emerald-500" />;
            })()}

            {editingName ? (
              <input autoFocus value={nameValue} onChange={e => setNameValue(e.target.value)}
                onBlur={() => { setEditingName(false); update({ contactName: nameValue }); }}
                className="bg-transparent text-white text-[28px] font-bold outline-none border-b border-white/20 flex-1" />
            ) : (
              <h1 onClick={() => setEditingName(true)} className="text-[28px] font-bold text-white cursor-text hover:bg-white/[0.03] rounded px-1 -mx-1">
                {data.contactName || <span className="text-neutral-600 italic">Sin nombre</span>}
              </h1>
            )}

            {data.crmId ? (
              <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-500 hover:text-neutral-300 text-[11px] font-mono">
                <Link size={10} /> #{data.crmId}
              </button>
            ) : <span className="text-[11px] text-neutral-700 font-mono">Generando...</span>}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center px-4 py-2 hover:bg-white/[0.03] rounded-lg gap-3">
              <List size={14} className="text-neutral-600" />
              <span className="w-44 text-[12px] text-neutral-500">Status</span>
              <BadgeSelect value={data.status || 'Nuevo Aplicante'} options={BADGE_OPTIONS} color="green" onChange={v => update({ status: v })} />
            </div>
            {/* Otros campos */}
            <div className="py-2"><div className="h-[1px] bg-white/[0.05]" /></div>
            {DOC_FIELDS.map(field => (
              <FileRow 
                key={field.key} 
                label={field.label} 
                fieldKey={field.key} 
                cardId={data.id} 
                groupId={data.groupId} 
                fileData={data.documents?.[field.key]} 
                allowMultiple={field.key === 'photo'}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

