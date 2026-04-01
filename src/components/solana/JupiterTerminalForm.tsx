'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function JupiterTerminalForm() {
  const { wallet } = useWallet();
  const jupiterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mintDelToken = process.env.NEXT_PUBLIC_CUSTOM_TOKEN_MINT;
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

    if (typeof window !== 'undefined' && 'Jupiter' in window && jupiterRef.current && mintDelToken) {
      // @ts-ignore
      window.Jupiter.init({
        displayMode: 'integrated',
        integratedTargetId: 'jupiter-terminal-container', 
        endpoint: rpcUrl,
        strictTokenList: false, 
        defaultExplorer: 'Solscan',
        formProps: {
          initialOutputMint: mintDelToken,
          fixedOutputMint: true, 
          initialInputMint: 'So11111111111111111111111111111111111111112', // SOL
        },
        passThroughWallet: wallet ? {
          wallet: wallet.adapter
        } : undefined,
      });
    }

    return () => {
      // Cleanup for hot reloads / React 18 strict mode
      if (typeof window !== 'undefined' && 'Jupiter' in window && jupiterRef.current) {
         // @ts-ignore
         window.Jupiter.close();
      }
    }
  }, [wallet]);

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 mt-6 relative before:absolute before:inset-0 before:bg-gradient-to-t before:from-purple-900/20 before:to-transparent z-10 transition-all duration-300">
      <div className="p-4 bg-gray-900/60 backdrop-blur-md border-b border-gray-800">
         <h3 className="text-xl font-bold font-inter text-center text-white">Adquirir Tokens de Acceso</h3>
         <p className="text-xs text-center text-gray-400 mt-2 tracking-wide leading-relaxed">
           Convierte tu liquidez en SOL o USDC para activar tu suscripción de Roosevelt utilizando el Swap descentralizado.
         </p>
      </div>
      
      {/* Contenedor donde Jup.ag inyectará la UI */}
      <div 
         id="jupiter-terminal-container" 
         ref={jupiterRef}
         className="w-full min-h-[400px] bg-black/50"
      />
    </div>
  );
}
