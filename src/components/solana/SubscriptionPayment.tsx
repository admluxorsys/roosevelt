'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferCheckedInstruction } from '@solana/spl-token';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function SubscriptionPayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { activeEntity, currentUser } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const customTokenMint = process.env.NEXT_PUBLIC_CUSTOM_TOKEN_MINT;
  const treasuryWalletAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET;

  const handlePayment = async () => {
    if (!publicKey) return toast.error('Conecta tu Phantom wallet primero');
    if (!currentUser || !activeEntity) return toast.error('Error de sesión. Reconecta tu cuenta.');
    if (!customTokenMint || !treasuryWalletAddress) return toast.error('Faltan variables de entorno para Solana.');

    setIsProcessing(true);
    try {
      const customMintPubkey = new PublicKey(customTokenMint);
      const treasuryPubkey = new PublicKey(treasuryWalletAddress);

      const userATA = await getAssociatedTokenAddress(customMintPubkey, publicKey);
      const treasuryATA = await getAssociatedTokenAddress(customMintPubkey, treasuryPubkey);
      
      const costPerMonth = 50; 
      const decimals = 6;
      const transferAmount = BigInt(costPerMonth * (10 ** decimals));

      const transaction = new Transaction().add(
         createTransferCheckedInstruction(
           userATA,              
           customMintPubkey,      
           treasuryATA,          
           publicKey,            
           transferAmount,
           decimals
         )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      toast.info('Transacción enviada por Solana. Esperando confirmación...');

      await connection.confirmTransaction(signature, 'confirmed');

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Usando el entityId y userId respetando el aislamiento total multitenant "Molde Único"
      const subscriptionRef = doc(
        db, 
        `users/${currentUser.uid}/entities/${activeEntity}/subscriptions/current`
      );

      await setDoc(subscriptionRef, {
        status: 'active',
        plan: 'pro-monthly',
        expiresAt: expirationDate.toISOString(),
        paymentSignature: signature,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast.success('¡Suscripción de 1 Mes activada con éxito!');
      
    } catch (error: any) {
      console.error(error);
      toast.error('La transacción falló: ' + (error?.message || 'Fondos insuficientes'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden w-full max-w-md mx-auto relative z-10 before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-600/10 before:to-purple-600/10 before:-z-10">
      <h2 className="text-2xl font-bold font-inter text-white">Activa tu Acceso</h2>
      <p className="text-gray-400 text-sm">Costo de procesamiento: 50 USD/mes usando Custom Tokens</p>
      <button 
        onClick={handlePayment} 
        disabled={isProcessing}
        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] transition-transform py-3 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isProcessing ? 'Procesando Smart Contract...' : 'Pagar 1 Mes de Acceso'}
      </button>
    </div>
  );
}
