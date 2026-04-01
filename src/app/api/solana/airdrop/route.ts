import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction } from '@solana/spl-token';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userPublicKeyStr, environment } = await req.json();

    if (!userPublicKeyStr) {
      return NextResponse.json({ error: 'Missing userPublicKeyStr' }, { status: 400 });
    }

    // Usaremos Devnet por defecto para desarrollo, procesalo según tu config
    const networkUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(networkUrl, 'confirmed');

    // MINT y PRIVATE_KEY desde .env
    const mintStr = process.env.NEXT_PUBLIC_CUSTOM_TOKEN_MINT || '';
    const serverPrivateKeyStr = process.env.SERVER_VAULT_PRIVATE_KEY || '';

    if (!mintStr || !serverPrivateKeyStr) {
       return NextResponse.json({ error: 'Server environment misconfigured for web3' }, { status: 500 });
    }

    const serverVaultKeypair = Keypair.fromSecretKey(bs58.decode(serverPrivateKeyStr));
    const customTokenMint = new PublicKey(mintStr);
    const userPublicKey = new PublicKey(userPublicKeyStr);

    const serverVaultATA = await getAssociatedTokenAddress(customTokenMint, serverVaultKeypair.publicKey);
    const userATA = await getAssociatedTokenAddress(customTokenMint, userPublicKey);

    const transaction = new Transaction();

    // ★ CRUCIAL: El usuario paga el gas fee
    transaction.feePayer = userPublicKey;

    const userAtaInfo = await connection.getAccountInfo(userATA);
    
    if (!userAtaInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          userATA,
          userPublicKey,
          customTokenMint
        )
      );
    }

    const decimals = 6;
    const requiredTokenAmount = 100; // airdrop initial tokens
    const amountToTransfer = BigInt(requiredTokenAmount * (10 ** decimals));

    transaction.add(
      createTransferCheckedInstruction(
        serverVaultATA,           
        customTokenMint,          
        userATA,                  
        serverVaultKeypair.publicKey, 
        amountToTransfer,         
        decimals                  
      )
    );

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;

    transaction.partialSign(serverVaultKeypair);

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');

    return NextResponse.json({ 
      transaction: serializedTransaction,
      message: 'Transaction successfully partially signed by vault.'
    });
  } catch (error: any) {
    console.error('API Airdrop Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error processing the airdrop' }, { status: 500 });
  }
}
