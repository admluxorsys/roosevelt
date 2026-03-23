import { NextResponse } from 'next/server';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { SYSTEM_PROMPT } from './prompt';

// Design pass for visual excellence
const REFINE_PROMPT = `
You are an Elite UI/UX Design Critic and Framer Motion Expert. Your job is to perform a FINAL visual pass on the provided code to ensure it meets world-class standards (Lovable/V0 quality).

1. INTENT ANALYSIS & VISUAL FIDELITY:
   - If TECH/CODING: Dark mode (#050505), glow effects, sharp typography, subtle grid lines, and interactive terminal-like components.
   - If LIFESTYLE/BOUTIQUE: Soft rounding (rounded-[3rem]), massive white space, organic floating animations, and elegant serif typography.
   - If CORPORATE: High-contrast, expert bento-grids, subtle hover-lift, and premium professional color palettes.

2. UNIVERSAL DIRECTIVES (MANDATORY):
   - GLASSMORPHISM: Apply 'backdrop-blur-xl bg-white/5 border border-white/10' (dark) or 'bg-white/40 border-white/60' (light).
   - TYPOGRAPHY: Hero titles MUST BE 'text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8'.
   - SPACING: Mandate 'py-32 md:py-48' for hero sections. No "small" padding.
   - BENTO-GRIDS: Convert repetitive lists into irregular, exciting Bento-grids with varied sizes and spanning.
   - ANIMATIONS: Use 'framer-motion'. Add 'animate-float' to main visuals. Every section MUST have a scroll reveal: 'initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}'.
   - INTERACTION: Every card and button MUST have a hover effect: 'whileHover={{ y: -10, scale: 1.02 }}'.

3. EXTREME SCALE & DEPTH (CRITICAL):
   - ONE PAGE IS NEVER ENOUGH: If the input is a single-page landing for a business, TRANSFORMATION into a multi-page HashRouter app is mandatory.
   - DEPTH: Every module MUST be fully populated with real-looking copywriting, high-quality Unsplash image URLs (Coffee, Business, Tech), and detailed sub-sections.
   - GLOBAL FEEL: Ensure a massive Footer and a premium sticky Navbar are present and functional across all routes.

🚨 VALIDATION & LINTING (CRITICAL) 🚨
- ICON AUDIT: Use valid 'lucide-react' icons ONLY.
- REACT ERROR #130: Verify every single component import.
- CLEANUP: Remove any business logic commentary from the code.

RULES:
- Maintain EXACT JSON structure.
- RETURN COMPLETE FILE CONTENT.
- EXCEED expectations in complexity.
`;

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'ai-route.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (e) {
    console.error('Logging failed', e);
  }
}

// Lazy Clients
let vertexAI: any = null;

function getVertexAI() {
  if (!vertexAI) {
    // Use service account from ENV if available
    let keyOptions: any = {};
    let saProject = '';
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        keyOptions = { credentials };
        saProject = credentials.project_id;
      } catch (e) { }
    }

    const project = saProject || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'roosevelt-platform-1';
    const location = 'us-central1';

    vertexAI = new VertexAI({
      project,
      location,
      googleAuthOptions: {
        credentials: keyOptions.credentials,
        scopes: [
          'https://www.googleapis.com/auth/cloud-platform',
          'https://www.googleapis.com/auth/userinfo.email'
        ]
      }
    });
    logToFile(`[getVertexAI] Initialized for project: ${project}`);
  }
  return vertexAI;
}

async function callVertex(modelName: string, messages: any[], fileContext: string): Promise<string> {
  logToFile(`[callVertex] Model: ${modelName}, Context Length: ${fileContext.length}`);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'roosevelt-platform-1';

  // Vertex AI is permanently broken (403 Permission Denied) — skip directly to Gemini API
  let lastError: any = new Error('Vertex AI skipped - going directly to Gemini API');
  logToFile(`[callVertex] Skipping Vertex AI (known 403), going directly to Gemini API Fallback...`);

  // Fallback logic
  if (process.env.GEMINI_API_KEY) {
    logToFile("[callVertex] Attempting Gemini API Fallback...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const tryModel = async (id: string, version: string = 'v1beta', maxRetries = 2) => {
      let cleanId = id.toLowerCase().trim();
      if (cleanId === 'gemini-pro') cleanId = 'gemini-1.5-pro';
      if (cleanId === 'gemini-flash') cleanId = 'gemini-1.5-flash';
      if (!cleanId.startsWith('gemini-')) cleanId = 'gemini-' + cleanId;
      if (cleanId === 'gemini-1.0-pro') cleanId = 'gemini-1.5-flash';

      const model = genAI.getGenerativeModel({
        model: cleanId,
        generationConfig: {
          maxOutputTokens: 65536,
          temperature: 0.8
        }
      }, { apiVersion: version });

      const contents = messages.map(m => {
        const parts: any[] = [{ text: m.content || "" }];
        if (m.images) {
          m.images.forEach((img: any) => {
            parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
          });
        }
        return { role: m.role === 'ai' || m.role === 'model' ? 'model' : 'user', parts };
      });

      if (contents.length > 0) {
        contents[0].parts.unshift({ text: SYSTEM_PROMPT });
      }

      const lastUserMsg = [...contents].reverse().find(c => c.role === 'user');
      if (lastUserMsg) {
        lastUserMsg.parts.push({ text: "\n\nContext:\n" + fileContext });
      }

      let delay = 500;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          logToFile(`[Gemini Fallback] Trying SDK: ${cleanId} (${version}) - Attempt ${i + 1}`);

          // Add a deadline/timeout for the model generation
          // 90s timeout — gemini-2.5-flash is a thinking model that needs more time
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout: AI generation took too long")), 120000)
          );

          const resultPromise = model.generateContent({ contents });
          const result: any = await Promise.race([resultPromise, timeoutPromise]);

          const responseText = (await result.response).text();
          if (!responseText) throw new Error("[TRANSIENT] Empty response from Gemini API");
          return responseText;
        } catch (e: any) {
          logToFile(`[Gemini Fallback] SDK Error for ${cleanId}: ${e.message}`);

          // Classify the error: 404/403 are permanent (model doesn't exist), skip immediately
          const is404or403 = e.message?.includes('404') || e.message?.includes('403');
          const isTransient = !is404or403 && (e.message?.includes('429') || e.message?.includes('500') || e.message?.includes('503') || e.message?.includes('Timeout') || e.message?.includes('[TRANSIENT]'));

          if (isTransient && i < maxRetries) {
            logToFile(`[Gemini Fallback] Transient error hit for ${cleanId}. Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }

          // For 404/403, throw immediately to skip to the next model
          if (is404or403) {
            logToFile(`[Gemini Fallback] ${cleanId} (${version}) returned ${is404or403 ? '404/403' : 'error'}. Skipping model.`);
            throw e;
          }

          throw e;
        }
      }
      throw new Error("Target retries exhausted");
    };

    // DIAGNOSTIC: List available models once if we hit issues
    if (!process.env.MODELS_LISTED) {
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const listData = await listRes.json();
        logToFile(`[Gemini Diagnostic] Available Models: ${JSON.stringify((listData.models || []).map((m: any) => m.name))}`);
        process.env.MODELS_LISTED = 'true';
      } catch (e) { }
    }

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3-flash-preview',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
    ];

    for (const id of modelsToTry) {
      try {
        // Try v1beta first as it has the newest models
        return await tryModel(id, 'v1beta');
      } catch (e: any) {
        logToFile(`[Gemini Fallback] ${id} v1beta failed: ${e.message}`);

        // If it's a 404, try v1 as a backup for that specific model
        if (e.message?.includes('404')) {
          try {
            return await tryModel(id, 'v1');
          } catch (v1Error: any) {
            logToFile(`[Gemini Fallback] ${id} v1 also failed: ${v1Error.message}`);
            lastError = v1Error;
          }
        } else {
          // If it's a 429 after retries, we MOVE TO THE NEXT MODEL instead of stopping
          // This is key because different models often have separate quotas
          logToFile(`[Gemini Fallback] ${id} exhausted. Rotating to next model...`);
          lastError = e;
        }
      }
    }
  }
  throw lastError;
}


// ============================================================================
// Cascading Fuzzy Matching System (Dyad-Inspired)
// Implements 4 passes with decreasing strictness:
//   Pass 1: Exact Match
//   Pass 2: Trailing Whitespace Ignored
//   Pass 3: All Edge Whitespace Ignored
//   Pass 4: Canonical (all whitespace, commas, semicolons collapsed)
// ============================================================================

type LineComparator = (fileLine: string, patternLine: string) => boolean;

const exactMatch: LineComparator = (a, b) => a === b;
const trailingWSIgnored: LineComparator = (a, b) => a.trimEnd() === b.trimEnd();
const allEdgeWSIgnored: LineComparator = (a, b) => a.trim() === b.trim();
const canonicalMatch: LineComparator = (a, b) =>
  a.replace(/[\s\n\r\t,;]+/g, '').trim() === b.replace(/[\s\n\r\t,;]+/g, '').trim();

const MATCHING_PASSES: { name: string; cmp: LineComparator }[] = [
  { name: 'exact', cmp: exactMatch },
  { name: 'trailing-ws', cmp: trailingWSIgnored },
  { name: 'all-edge-ws', cmp: allEdgeWSIgnored },
  { name: 'canonical', cmp: canonicalMatch },
];

function findMatchPositions(resultLines: string[], searchLines: string[], cmp: LineComparator): number[] {
  const positions: number[] = [];
  for (let i = 0; i <= resultLines.length - searchLines.length; i++) {
    let allMatch = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (!cmp(resultLines[i + j], searchLines[j])) { allMatch = false; break; }
    }
    if (allMatch) {
      positions.push(i);
      if (positions.length > 1) break; // Ambiguity detected, stop early
    }
  }
  return positions;
}

function trimEmptyLines(lines: string[]): string[] {
  const result = [...lines];
  while (result.length > 0 && result[0] === '') result.shift();
  while (result.length > 0 && result[result.length - 1] === '') result.pop();
  return result;
}

function cascadingMatch(resultLines: string[], searchLines: string[]): { matchIndex: number; error?: string; passName?: string } {
  for (const pass of MATCHING_PASSES) {
    const positions = findMatchPositions(resultLines, searchLines, pass.cmp);
    if (positions.length > 1) {
      return { matchIndex: -1, error: `Ambiguous match in ${pass.name} pass` };
    }
    if (positions.length === 1) {
      if (pass.name !== 'exact') logToFile(`[cascadingMatch] Matched via "${pass.name}" pass.`);
      return { matchIndex: positions[0], passName: pass.name };
    }
  }
  return { matchIndex: -1, error: 'No match found in any pass.' };
}

function applySearchReplace(content: string, search: string, replace: string): string {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  let resultLines = content.split(/\r?\n/);
  let searchLines = search.split(/\r?\n/);
  const replaceLines = replace.split(/\r?\n/);

  if (searchLines.length === 0 || (searchLines.length === 1 && searchLines[0] === '')) {
    logToFile('[applySearchReplace] WARNING: Empty search block.');
    return content;
  }

  // Attempt cascading match
  let matchResult = cascadingMatch(resultLines, searchLines);

  // Fallback: try trimming leading/trailing empty lines from search
  if (matchResult.error && !matchResult.error.includes('Ambiguous')) {
    const trimmed = trimEmptyLines(searchLines);
    if (trimmed.length !== searchLines.length && trimmed.length > 0) {
      const trimmedResult = cascadingMatch(resultLines, trimmed);
      if (!trimmedResult.error) {
        matchResult = trimmedResult;
        searchLines = trimmed;
        logToFile('[applySearchReplace] Matched after trimming empty lines from search block.');
      }
    }
  }

  if (matchResult.error) {
    logToFile(`[applySearchReplace] WARNING: ${matchResult.error}`);
    return content; // Return unchanged
  }

  const matchIndex = matchResult.matchIndex;
  const matchedLines = resultLines.slice(matchIndex, matchIndex + searchLines.length);

  // Preserve indentation relative to the first matched line
  const originalBaseIndent = (matchedLines[0]?.match(/^[\t ]*/) || [''])[0];
  const searchBaseIndent = (searchLines[0]?.match(/^[\t ]*/) || [''])[0];
  const searchBaseLevel = searchBaseIndent.length;

  const indentedReplaceLines = replaceLines.map(line => {
    const currentIndentMatch = line.match(/^[\t ]*/);
    const currentIndent = currentIndentMatch ? currentIndentMatch[0] : '';
    const currentLevel = currentIndent.length;
    const relativeLevel = currentLevel - searchBaseLevel;

    const finalIndent = relativeLevel < 0
      ? originalBaseIndent.slice(0, Math.max(0, originalBaseIndent.length + relativeLevel))
      : originalBaseIndent + currentIndent.slice(searchBaseLevel);

    return finalIndent + line.trim();
  });

  const beforeMatch = resultLines.slice(0, matchIndex);
  const afterMatch = resultLines.slice(matchIndex + searchLines.length);
  resultLines = [...beforeMatch, ...indentedReplaceLines, ...afterMatch];

  logToFile(`[applySearchReplace] SUCCESS: Applied edit at line ${matchIndex + 1} (${matchResult.passName} pass).`);
  return resultLines.join(lineEnding);
}

function parseSearchReplace(text: string): { search: string; replace: string }[] {
  const deltas: { search: string; replace: string }[] = [];
  const regex = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    deltas.push({ search: match[1], replace: match[2] });
  }
  return deltas;
}

function extractJSON(responseText: string, currentFiles: Record<string, string> = {}) {
  // Guard against undefined/null responseText
  if (!responseText || typeof responseText !== 'string') {
    logToFile(`[extractJSON] ERROR: responseText is ${typeof responseText}. Returning error message.`);
    return { type: "message", content: "Error: La IA no devolvió una respuesta válida. Reintenta en unos segundos." };
  }
  // 1. Strip <think> tags completely before processing JSON
  let cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // If after stripping think tags there's nothing left, the AI only "thought" but produced no output
  if (!cleaned || cleaned.length < 10) {
    logToFile(`[extractJSON] AI returned only think tags with no actual output. Length after strip: ${cleaned.length}`);
    return { type: "message", content: "La IA analizó tu solicitud pero no generó código. Reintenta con una instrucción más específica." };
  }

  // Try to find ALL dyad-search-replace tags (supports optional description attribute)
  const dyadRegex = /<dyad-search-replace path="([^"]*)"(?:\s+description="([^"]*)")?>([\s\S]*?)<\/dyad-search-replace>/g;
  let dyadMatches: { path: string; description?: string; body: string }[] = [];
  let match;

  while ((match = dyadRegex.exec(cleaned)) !== null) {
    dyadMatches.push({ path: match[1], description: match[2], body: match[3] });
  }

  if (dyadMatches.length > 0) {
    const virtualFiles = { ...currentFiles };
    let successCount = 0;
    let failCount = 0;
    let appliedPaths: string[] = [];
    let failedPaths: string[] = [];

    for (const dyad of dyadMatches) {
      const deltas = parseSearchReplace(dyad.body);
      let content = virtualFiles[dyad.path] || "";
      let originalContent = content;

      if (!content && dyad.path.startsWith('src/')) {
        // Fallback for paths that might be missing 'src/' prefix in state but have it in prompt
        const altPath = dyad.path.replace('src/', '');
        content = virtualFiles[altPath] || "";
      }

      let fileEditsApplied = 0;
      for (const delta of deltas) {
        const newContent = applySearchReplace(content, delta.search, delta.replace);
        if (newContent !== content) {
          content = newContent;
          fileEditsApplied++;
        }
      }

      if (fileEditsApplied > 0) {
        virtualFiles[dyad.path] = content;
        successCount++;
        appliedPaths.push(dyad.path.split('/').pop() || "");
      } else {
        failCount++;
        failedPaths.push(dyad.path.split('/').pop() || "");
      }
    }

    // Build a nice report for the user
    let report = "";
    if (successCount > 0) {
      report += `✅ Actualizado: ${appliedPaths.join(', ')}. `;
    }
    if (failCount > 0) {
      report += `⚠️ No se pudo aplicar el cambio en: ${failedPaths.join(', ')} (el código original no coincide exactamente).`;
    }
    if (successCount === 0 && failCount === 0) {
      report = "No se encontraron cambios válidos para aplicar.";
    }

    const filesToReturn = Object.entries(virtualFiles)
      .filter(([path, content]) => currentFiles[path] !== content)
      .map(([path, content]) => ({ path, content }));

    return {
      type: "code_update",
      files: filesToReturn,
      content: report || "Surgical update processed."
    };
  }

  try {
    // 2. Locate the outermost JSON object (fallback to full JSON response)
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in response");
    }

    let jsonPart = cleaned.substring(start, end + 1);

    // ABORTIVE SANITIZATION: Remove actual control characters that break JSON.parse
    // EXCEPT for legitimate whitespace (\n, \t, \r)
    jsonPart = jsonPart.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');

    // SANITIZE: Fix common AI JSON mistakes before parsing
    // 1. Fix unescaped newlines inside string values (safer method without regex lookbehinds)
    try {
      jsonPart = jsonPart.split('\n').map(line => {
        // If the line isn't ending the JSON object or array, it might be a broken string
        return line.trim() === '' ? '\\n' : line;
      }).join('');
      // Just do basic cleanup instead of complex lookbehinds that break SWC
    } catch (e) { }
    // 2. Remove trailing commas before } or ]
    jsonPart = jsonPart.replace(/,\s*([\]}])/g, '$1');

    const parsed = JSON.parse(jsonPart);

    // Ensure we provide the "friendly summary" if it's missing or too technical
    if (parsed.type === 'code_update' && (!parsed.content || parsed.content.includes('.tsx'))) {
      parsed.content = "He aplicado los cambios solicitados en el diseño y la estructura.";
    }

    return parsed;
  } catch (e: any) {
    logToFile(`[extractJSON] Failed to parse: ${e.message}. Raw preview: ${cleaned.substring(0, 200)}...`);

    // Fallback: try regex match with aggressive sanitization
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let sanitized = jsonMatch[0]
          .replace(/,\s*([\]}])/g, '$1')     // trailing commas
          .replace(/'/g, '"');                // single quotes
        return JSON.parse(sanitized);
      } catch (innerErr) {
        logToFile(`[extractJSON] Regex match also failed: ${jsonMatch[0].substring(0, 100)}`);
      }
    }

    // ROBUST LAST RESORT: Extract files individually from broken JSON
    // This handles the common case where the AI returns valid structure but 
    // the file content has unescaped characters that break JSON.parse()
    try {
      const typeMatch = cleaned.match(/"type"\s*:\s*"([^"]+)"/);
      const contentMatch = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      if (typeMatch && typeMatch[1] === 'code_update') {
        // strategy 1: Multi-pattern extraction for robust file catching
        const extractedFiles: { path: string; content: string }[] = [];
        const pathRegex = /"path"\s*:\s*"([^"]+)"/g;
        let pathMatch;
        const pathPositions: { path: string; index: number }[] = [];
        while ((pathMatch = pathRegex.exec(cleaned)) !== null) {
          pathPositions.push({ path: pathMatch[1], index: pathMatch.index });
        }

        for (let i = 0; i < pathPositions.length; i++) {
          const { path, index } = pathPositions[i];
          // Find the "content" after this "path"
          const endBound = i < pathPositions.length - 1 ? pathPositions[i + 1].index : cleaned.length;
          const segment = cleaned.substring(index, endBound);

          // Extract content: find "content": " then read until the closing pattern
          // The content ends at "} or ", "path" — whichever comes first
          const contentStart = segment.indexOf('"content"');
          if (contentStart === -1) continue;

          const afterContentKey = segment.substring(contentStart);
          // Find the opening quote of the content value
          const valueStart = afterContentKey.indexOf('": "');
          if (valueStart === -1) continue;

          const contentBody = afterContentKey.substring(valueStart + 4);

          // Walk through to find the real end of the string
          // Account for escaped quotes
          let fileContent = '';
          let j = 0;
          let escaped = false;
          while (j < contentBody.length) {
            const ch = contentBody[j];
            if (escaped) {
              fileContent += ch;
              escaped = false;
            } else if (ch === '\\') {
              fileContent += ch;
              escaped = true;
            } else if (ch === '"') {
              break; // End of string value
            } else {
              fileContent += ch;
            }
            j++;
          }

          // Unescape the content properly
          try {
            // Restore actual characters from escaped sequences
            fileContent = JSON.parse(`"${fileContent}"`);
          } catch {
            // Simple manual fallback if JSON.parse fails
            fileContent = fileContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }

          if (path && fileContent.length > 10) {
            extractedFiles.push({ path, content: fileContent });
          }
        }

        if (extractedFiles.length > 0) {
          logToFile(`[extractJSON] ROBUST RESCUE: Extracted ${extractedFiles.length} files from broken JSON: ${extractedFiles.map(f => f.path).join(', ')}`);
          return {
            type: 'code_update',
            files: extractedFiles,
            content: contentMatch ? contentMatch[1] : 'Cambios aplicados (respuesta parcialmente recuperada).'
          };
        }
      }
    } catch (rescueErr: any) {
      logToFile(`[extractJSON] Robust rescue failed: ${rescueErr.message}`);
    }

    return { type: "message", content: "Invalid AI response format." };
  }
}

async function agenticFlow(messages: any[], fileContext: string, currentFiles: Record<string, string>, modelName: string = "Gemini 1.5 Pro") {
  logToFile("[AgenticFlow] Starting Multi-Agent Pipeline...");
  const startTime = Date.now();

  // Stage 1: Architect & Code Generation (with retry for think-only/parse failures)
  let result;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logToFile(`[AgenticFlow] Stage 1: Architecting with ${modelName}... (Attempt ${attempt}/${maxAttempts})`);
      const rawResult = await callVertex(modelName, messages, fileContext);
      result = extractJSON(rawResult, currentFiles);

      // If we got actual code/data, we're done — break out of the retry loop
      if (result && result.type !== 'message') {
        break;
      }

      // If it's a "message" type (think-only, parse failure, etc.), retry
      if (attempt < maxAttempts) {
        logToFile(`[AgenticFlow] Attempt ${attempt} returned message type: "${result?.content?.substring(0, 80)}". Retrying...`);
        await new Promise(r => setTimeout(r, 1000)); // Brief delay before retry
      }
    } catch (e: any) {
      logToFile(`[AgenticFlow] Stage 1 Failed (Attempt ${attempt}): ${e.message}`);
      if (attempt >= maxAttempts) {
        const isRateLimit = e.message?.includes('429');
        const msg = isRateLimit
          ? "Limite de peticiones AI alcanzado. Por favor, espera 30 segundos y reintenta."
          : `AI Architect failure: ${e.message?.substring(0, 100)}... Reintenta en unos segundos.`;
        return { type: "message", content: msg };
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Stage 2 (Visual Polishing) DISABLED for speed — quality rules are now in the main prompt

  logToFile(`[AgenticFlow] Pipeline completed in ${Date.now() - startTime}ms`);
  return result;
}

export async function POST(req: Request) {
  try {
    const { messages, currentFiles, model, supabaseConfig, projectId, userId, entityId } = await req.json();
    logToFile(`[POST] Request started. Model: ${model}, Messages: ${messages.length}`);

    const fileEntries = Object.entries(currentFiles || {}) as [string, string][];
    const filteredFiles = fileEntries.filter(([path]) => {
      const isAsset = path.includes('assets/') || path.includes('public/') || path.includes('lovable-uploads/');
      const isCode = path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js') || path.endsWith('.css');
      return isCode || isAsset;
    });

    // Detect project state for progressive generation strategy
    const codeFiles = filteredFiles.filter(([p]) => p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.css'));
    const hasPages = codeFiles.some(([p]) => p.includes('/pages/') || p.includes('/features/'));
    const hasHomePage = codeFiles.some(([p]) => p.toLowerCase().includes('home') || p.toLowerCase().includes('landing'));
    const isFreshProject = codeFiles.length <= 5; // Only boilerplate files exist

    let generationStrategy = `
🚨 CRITICAL RULE: NO DESTRUCTIVE CHANGES 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must NEVER delete, empty, or break the existing project files when adding new features like Supabase, Firebase, or complex logic.
Modify ONLY the files required for the new feature and KEEP ALL OTHER FILES INTACT.
Returning an empty JSON or emitting destructive changes will instantly crash the project. NEVER do this.
`;
    if (isFreshProject && !hasHomePage) {
      // PHASE 1: Fresh project — generate only the foundation
      generationStrategy = `
🎯 GENERATION STRATEGY: PHASE 1 — FOUNDATION FIRST 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a BRAND NEW project. To ensure MAXIMUM QUALITY and prevent loading errors, follow this strategy:

1. GENERATE ONLY THESE FILES (no more):
   - src/index.css — Complete design system with CSS variables (colors, fonts, spacing, shadows)
   - src/App.tsx — HashRouter with routes DEFINED for future pages (Home, Menu/Services, About, Contact) but ONLY HomePage implemented. Import pages using NAMED imports: \`import { HomePage } from './pages/HomePage'\`. ⚡ CRITICAL: App.tsx MUST use \`export default App;\` at the bottom.
   - src/features/Navbar/Navbar.tsx — Premium sticky navbar. Use NAMED EXPORT: \`export const Navbar = ...\`
   - src/features/Footer/Footer.tsx — Rich footer with columns. Use NAMED EXPORT: \`export const Footer = ...\`
   - src/pages/HomePage.tsx — THE MAIN PAGE. Use NAMED EXPORT: \`export const HomePage = ...\`
   - src/pages/ComingSoonPage.tsx — A beautiful placeholder. Use NAMED EXPORT: \`export const ComingSoonPage = ...\`

2. QUALITY FOCUS:
   - Dedicate 80% of your output tokens to HomePage.tsx — it MUST be breathtaking
   - Apply glassmorphism, gradients, framer-motion animations, bento grids
   - HomePage MUST have at least 6 rich sections: Hero, Features, Gallery/Showcase, Testimonials, Stats, CTA
   - The Navbar MUST show links to all planned pages (even if they route to ComingSoonPage for now)
   - IMAGES: Use ONLY these VERIFIED working image URLs (pick the ones that match the theme):
     COFFEE/CAFETERIA:
       https://images.unsplash.com/photo-1447933601403-56dc94df4175?w=800&q=80
       https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80
       https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80
       https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80
       https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80
       https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80
       https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80
       https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&q=80
     FOOD/BAKERY:
       https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80
       https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80
       https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80
       https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80
      BEAUTY/COSMETICS:
        https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800&q=80
        https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80
        https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80
        https://images.unsplash.com/photo-1571781926291-c477ecfd024b?w=800&q=80
        https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80
        https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80
      RESTAURANT/INTERIOR:
       https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80
       https://images.unsplash.com/photo-1552566626-98f62d27f5c9?w=800&q=80
       https://images.unsplash.com/photo-1559329007-40d22fd2b3c8?w=800&q=80
     PEOPLE/TEAM:
       https://i.pravatar.cc/150?img=1 through https://i.pravatar.cc/150?img=70 (for avatars)
     GENERIC/NATURE:
       https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80
       https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80
       https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80
   - NEVER invent Unsplash photo IDs. ONLY use URLs from the list above or picsum.photos/800/600
   - NEVER use local /assets/ paths

3. CRITICAL UTILS RULE:
   - src/lib/utils.ts ONLY exports the function "cn()" for class merging. DO NOT import anything else from it.
   - NEVER import generateUniqueId, generateId, uuid, or any other invented function. Use crypto.randomUUID() or Math.random() inline instead.

4. RESPONSE BREVITY:
   - The "content" field in your JSON response MUST be 2-3 lines maximum.
   - Example: "Página principal de cafetería creada con hero, menú, testimonios y CTA. Incluye navbar, footer y sistema de diseño."
   - Do NOT list every file changed in the content — the file list is shown automatically in the UI.

DO NOT generate Menu, About, Contact, or other pages yet. The user will ask for them next.
`;
      logToFile(`[POST] Progressive Gen: PHASE 1 — Foundation (${codeFiles.length} code files)`);
    } else if (hasHomePage && hasPages) {
      // PHASE 2+: Project has pages — follow established design
      generationStrategy = `
🎯 GENERATION STRATEGY: FOLLOW ESTABLISHED DESIGN 🎯
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This project ALREADY has an established design. When generating new pages or modifying existing ones:

1. DESIGN CONSISTENCY:
   - Extract the color palette, typography, and spacing from the existing globals.css and components
   - New pages MUST match the visual quality and style of the existing HomePage
   - Use the SAME animation patterns, glassmorphism level, and layout approach as existing pages
   - Reuse the existing Navbar and Footer components
   - MANDATORY: Use NAMED EXPORTS for all new components (e.g., \`export const NewPage = ...\`). NEVER use \`export default\`.
   - ZUSTAND STORES: Use \`export const useStore = create(...)\`. NEVER use \`export default\`.

2. SINGLE PAGE FOCUS:
   - If the user asks for a new page, generate ONLY that one page file
   - Make the new page just as rich and detailed as the HomePage (6+ sections minimum)
   - Update App.tsx routes to include the new page (replace ComingSoonPage if applicable)

3. IMAGE RULES:
   - ONLY use URLs from the VERIFIED list provided in the existing files, or use https://picsum.photos/800/600 as fallback
   - NEVER invent Unsplash photo IDs — only use IDs already present in the project's code
   - NEVER reference local /assets/ paths unless those files already exist in the project

4. CRITICAL UTILS RULE:
   - src/lib/utils.ts ONLY exports "cn()". NEVER import anything else from it.
   - NEVER import generateUniqueId, generateId, uuid, or similar. Use crypto.randomUUID() inline.

5. RESPONSE BREVITY:
   - The "content" field MUST be 2-3 lines max. Do NOT list every file — the UI shows them automatically.
`;
      logToFile(`[POST] Progressive Gen: PHASE 2+ — Follow design (${codeFiles.length} code files, hasPages=${hasPages})`);
    }

    if (supabaseConfig?.url && supabaseConfig?.key) {
      generationStrategy += `
🚨 MANDATORY SUPABASE CONFIGURATION 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user has enabled Supabase. You MUST create/update these EXACT files:

1. \`.env\` (at the root):
VITE_SUPABASE_URL=${supabaseConfig.url}
VITE_SUPABASE_ANON_KEY=${supabaseConfig.key}

2. \`src/lib/supabase.ts\`:
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

NEVER use placeholders like 'your-project-url'. Use the exact values provided above.
`;
      logToFile(`[POST] Injected Supabase Config for AI.`);
    }

    if (userId && entityId && projectId) {
      generationStrategy += `
🚨 STRICT FIRESTORE MULTI-TENANT ARCHITECTURE 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If you need to use Firebase Firestore to store data (like web forms, leads), you MUST ALWAYS use this EXACT path structure:
\`collection(db, "users", "${userId}", "entities", "${entityId}", "web-projects", "${projectId}", "[YOUR_COLLECTION_NAME]")\`
 NEVER use a root-level collection like "contacts" or "web-projects".
`;
      logToFile(`[POST] Injected Multi-Tenant DB Config for AI.`);
    }

    let fileContext = filteredFiles.length > 0 ? "\n\nCONTEXT:\n" + filteredFiles
      .map(([p, c]) => {
        if (p.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          return `--- FILE: ${p} --- [IMAGE ASSET AVAILABLE]`;
        }
        return `--- FILE: ${p} ---\n${c}\n`;
      }).join("\n").substring(0, 100000) : "";

    // Prepend generation strategy to context
    if (generationStrategy) {
      fileContext = "\n\n" + generationStrategy + fileContext;
    }

    // ALL requests now use the Agentic Flow (Architect + Refiner) to ensure quality
    let finalResult = await agenticFlow(messages, fileContext, currentFiles || {}, model || "Gemini 1.5 Flash");

    // SANITY CHECK: Block AI responses that attempt to wipe out the project by returning an empty files array
    // ONLY block if it's a code_update (plans and questions are fine)
    if (finalResult && finalResult.type === 'code_update' && (!finalResult.files || finalResult.files.length === 0)) {
       logToFile("[POST] SANITY CHECK FAILED: AI returned code_update with no files! Blocking response to protect project.");
       return NextResponse.json({ type: "message", content: "Error de seguridad: La IA generó una respuesta inválida (sin código). Por favor, intenta de nuevo con instrucciones más detalladas." });
    }

    logToFile(`[POST] Returning successful code update with ${finalResult?.files?.length ?? 'N/A'} files.`);
    return NextResponse.json(finalResult ?? { type: 'message', content: 'Error interno: respuesta vacía del modelo.' });

  } catch (e: any) {
    logToFile(`[Vertex API Error] ${e.message}`);
    return NextResponse.json({ type: "message", content: "Error: " + e.message }, { status: 500 });
  }
}

