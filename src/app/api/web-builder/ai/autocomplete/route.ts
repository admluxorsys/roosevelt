import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

export async function POST(req: Request) {
    try {
        const { prompt, prefix, suffix, filePath } = await req.json();

        const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'udreamms-platform-1';
        const location = 'us-central1';

        let keyOptions = {};
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                keyOptions = { credentials };
            } catch (e) { }
        }

        const vertexAI = new VertexAI({ project, location, ...keyOptions });
        const model = vertexAI.getGenerativeModel({
            model: 'codegemma-7b', // Standard pre-trained CodeGemma from Model Garden
            generationConfig: {
                maxOutputTokens: 128,
                temperature: 0.2,
                topP: 0.95,
            },
        });

        // CodeGemma FIM (Fill-In-the-Middle) format
        const fimPrompt = `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`;

        const result = await model.generateContent(fimPrompt);
        const response = await result.response;
        const suggestion = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({ suggestion });

    } catch (e: any) {
        console.error('[Autocomplete Error]', e);
        return NextResponse.json({ suggestion: '' });
    }
}

