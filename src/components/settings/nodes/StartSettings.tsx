
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface StartSettingsProps {
  node: Node;
  updateNodeConfig: (nodeId: string, data: object) => void;
}

export const StartSettings: React.FC<StartSettingsProps> = ({ node, updateNodeConfig }) => {
  // Establecemos el número por defecto si no existe en la data del nodo
  const defaultNumber = '13858882799';
  const [triggerPhrase, setTriggerPhrase] = useState(node.data.triggerPhrase || 'Hola, quiero más información');
  const [phoneNumber, setPhoneNumber] = useState(node.data.phoneNumber || defaultNumber);
  const [copied, setCopied] = useState(false);

  // Aseguramos que la configuración del nodo tenga el número guardado si estaba vacío
  useEffect(() => {
    if (!node.data.phoneNumber) {
        updateNodeConfig(node.id, { ...node.data, phoneNumber: defaultNumber });
    }
  }, []);

  // Generar el link de kamban
  const generateWaLink = () => {
    if (!phoneNumber) return '';
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Eliminar todo lo que no sea número
    const encodedText = encodeURIComponent(triggerPhrase);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  };

  const waLink = generateWaLink();

  const handlePhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhrase = e.target.value;
    setTriggerPhrase(newPhrase);
    updateNodeConfig(node.id, { ...node.data, triggerPhrase: newPhrase });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);
    updateNodeConfig(node.id, { ...node.data, phoneNumber: newPhone });
  };

  const copyToClipboard = async () => {
    if (!waLink) return;

    try {
      // Intento 1: API moderna
      await navigator.clipboard.writeText(waLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Enlace copiado al portapapeles');
    } catch (err) {
      console.warn('Falló clipboard.writeText, usando fallback:', err);
      
      // Intento 2: Fallback robusto
      try {
        const textArea = document.createElement("textarea");
        textArea.value = waLink;
        
        // Estilos para hacerlo "invisible" pero interactuable
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        textArea.style.width = "1px";
        textArea.style.height = "1px";
        textArea.style.padding = "0";
        
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Enlace copiado al portapapeles');
        } else {
            throw new Error('execCommand devolvió false');
        }
      } catch (fallbackErr) {
        console.error('Error al copiar:', fallbackErr);
        toast.error('No se pudo copiar automáticamente. Por favor selecciona y copia el texto manualmente.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Frase Activadora (Trigger)</Label>
        <p className="text-xs text-neutral-400">
          Cuando un usuario envíe esta frase exacta, el bot iniciará este flujo.
        </p>
        <Input 
          value={triggerPhrase} 
          onChange={handlePhraseChange} 
          placeholder="Ej: Deseo mayor información" 
          className="bg-neutral-900 border-neutral-700"
        />
      </div>

      <div className="space-y-2">
        <Label>Número de kamban del Bot</Label>
         <p className="text-xs text-neutral-400">
          Este es el número oficial de tu bot.
        </p>
        <Input 
          value={phoneNumber} 
          onChange={handlePhoneChange} 
          placeholder="Ej: 13858882799" 
          type="tel"
          className="bg-neutral-900 border-neutral-700"
        />
      </div>

      {phoneNumber && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Enlace Directo</CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Comparte este link. Al hacer clic, el usuario tendrá el mensaje listo para enviar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-300 break-all select-all cursor-text">
              {waLink}
            </div>
            <div className="flex gap-2 mt-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                    onClick={copyToClipboard}
                >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copiado' : 'Copiar'}
                </Button>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-neutral-400 hover:text-white"
                    onClick={() => window.open(waLink, '_blank')}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

