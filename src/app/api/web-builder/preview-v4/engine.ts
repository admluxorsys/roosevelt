import { BOOTSTRAP_SCRIPT } from './constants';

/**
 * Preview Engine - Stability v8.5.2-Z (OmniShield Final)
 */

export function generatePreviewHTML(files: Record<string, string>): string {
    const filesToProcess: Record<string, string> = {};
    
    // SAFEGUARD: Ensure files is a valid object before iterating
    if (!files || typeof files !== 'object' || Array.isArray(files)) {
        console.warn("[OmniShield] Invalid files object received:", typeof files);
    } else {
        Object.entries(files).forEach(([path, content]) => {
            if (typeof path !== 'string' || typeof content !== 'string') return;
            let newPath = path;
            if (path.includes('src/src/')) newPath = path.replace('src/src/', 'src/');
            if (path.includes('src/pages/main.tsx')) newPath = 'src/main.tsx';
            if (path.includes('src/pages/App.tsx')) newPath = 'src/App.tsx';
            if (path.includes('src/pages/index.css')) newPath = 'src/index.css';
            if (path.includes('src/pages/pages/')) newPath = path.replace('src/pages/pages/', 'src/pages/');
            if (path.endsWith('App.tsx') && !path.includes('src/')) newPath = 'src/App.tsx';
            filesToProcess[newPath] = content;
        });
    }

    const codeFiles = Object.entries(filesToProcess).filter(([p]) => {
        if (p.match(/(vite|eslint|postcss|tailwind)\.config/)) return false;
        return p.endsWith('.tsx') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.css') || p.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
    });

    const cssContent = Object.entries(filesToProcess)
        .filter(([p]) => p.endsWith('.css'))
        .map(([_, c]) => c).join('\n');

    const filesJSON = JSON.stringify(Object.fromEntries(codeFiles));

    // 1. WELCOME SCREEN (Static 8.5.1)
    if (codeFiles.filter(([p]) => p.match(/\.(tsx|ts|jsx|js)$/)).length === 0) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Visor v8.5.2-Z (OmniShield)</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                html, body { margin: 0; padding: 0; background: #000; color: #fff; font-family: sans-serif; height: 100%; overflow: hidden; }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce 2s infinite; }
            </style>
        </head>
        <body class="flex items-center justify-center min-h-screen">
            <div style="background:linear-gradient(135deg, #050505 0%, #000 100%); color:#fff; padding:60px; border-radius:40px; text-align:center; max-width:650px; border:1px solid rgba(255,255,255,0.05); box-shadow:0 50px 100px rgba(0,0,0,0.8);">
                <div class="bg-blue-500/10 w-24 h-24 rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
                    <span class="text-5xl animate-bounce-slow">🛡️</span>
                </div>
                <h1 class="text-4xl font-extrabold tracking-tight mb-4 text-white">Escudo v8.5.2-Z Activo</h1>
                <p class="text-zinc-400 text-lg leading-relaxed mb-10">Protección OmniShield Finalizada.</p>
            </div>
        </body>
        </html>`.trim();
    }

    // 2. BOOTSTRAP ENGINE (v8.5.1 Core)
    return [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8" />',
        '    <title>Visor v8.5.2-Z (OmniShield)</title>',
        '    ',
        '    <!-- Libraries Stack -->',
        '    <script src="/api/web-builder/cdn-proxy?url=https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.development.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.development.js"></script>',
        '    ',
        '    <!-- No early polyfills here - handled in v8.5.2-Z bootstrap -->',
        '    <script>console.log("[v8.5.2-Z] Core HTML Engine Ready");</script>',
        '',
        '    <script src="/api/web-builder/cdn-proxy?url=https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.5/babel.min.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://cdn.tailwindcss.com"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/@remix-run/router@1.16.1/dist/router.umd.min.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/react-router@6.23.1/dist/umd/react-router.production.min.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/react-router-dom@6.23.1/dist/umd/react-router-dom.production.min.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/framer-motion@11.0.8/dist/framer-motion.js"></script>',
        '    <!-- Zustand CDN removed - Handled in v8.5.2-Z Core locally -->',
        '    <script src="/api/web-builder/cdn-proxy?url=https://unpkg.com/@tanstack/react-query@4.36.1/build/umd/index.production.js"></script>',
        '    ',
        '    <!-- Firebase Support -->',
        '    <script src="/api/web-builder/cdn-proxy?url=https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>',
        '    <script src="/api/web-builder/cdn-proxy?url=https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>',
        '',
        '    <base href="/">',
        '    <style>',
        '        html, body { margin: 0; padding: 0; font-family: sans-serif; height: 100%; width: 100%; overflow: auto; }',
        cssContent,
        '        #root { min-height: 100vh; width: 100%; position: relative; }',
        '        #loader { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #000; position: fixed; inset: 0; z-index: 999; flex-direction: column; gap:15px; opacity: 1; pointer-events: auto; transition: opacity 0.3s; }',
        '        #survival-logs { font-family:monospace; font-size:10px; color:#555; max-width:500px; text-align:left; background: rgba(0,0,0,0.7); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); max-height: 150px; overflow: auto; display: none; }',
        '    </style>',
        '</head>',
        '<body>',
        '    <div id="loader">',
        '        <div class="text-4xl">🛡️</div>',
        '        <div id="survival-logs"></div>',
        '    </div>',
        '    <div id="root"></div>',
        '    <script id="files-data" type="application/json">' + filesJSON.replace(/<\/script/g, '<\\/script') + '</script>',
        '    <script>' + BOOTSTRAP_SCRIPT(filesJSON).replace(/<\/script/g, '<\\/script') + '</script>',
        '</body>',
        '</html>'
    ].join('\n');
}
