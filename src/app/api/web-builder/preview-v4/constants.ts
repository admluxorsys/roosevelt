/**
 * Preview Engine Constants - Stability v8.5.1 (Refined)
 * 
 * Logic:
 * 1. OmniShield v8.5.1: Classic loading shield and stable proxies.
 * 2. Infinite Resilience: Safe array/string methods (from v8.5.8).
 * 3. Project Isolation: Unique storage keys (from v8.6.3).
 */

export const BOOTSTRAP_SCRIPT = (filesJSON: string) => `
    (function () {
        console.log("[v8.5.1-R] Classic OmniShield Active");

        // PROJECT ISOLATION: Clean boot for new projects
        if (!sessionStorage.getItem('visor_project_isolated_v851')) {
            console.log("[v8.5.1-R] Isolation: Purging generic storage keys...");
            const keysToPurge = ['cart-storage', 'user-storage', 'auth-storage'];
            keysToPurge.forEach(k => localStorage.removeItem(k));
            sessionStorage.setItem('visor_project_isolated_v851', 'true');
        }

        function logToSurvival(msg, type) {
            console.log("[Visor Log]", msg);
            var survival = document.getElementById('survival-logs');
            if (survival) {
                var line = document.createElement('div');
                line.style.marginTop = '2px';
                line.style.padding = '2px 5px';
                line.style.borderLeft = '3px solid ' + (type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : type === 'info' ? '#3b82f6' : '#666');
                line.style.color = type === 'error' ? '#fca5a5' : type === 'success' ? '#bbf7d0' : type === 'info' ? '#bfdbfe' : '#999';
                line.textContent = "[" + new Date().toLocaleTimeString().split(' ')[0] + "] " + msg;
                survival.appendChild(line);
                survival.scrollTop = survival.scrollHeight;
            }
            if (type === 'error') showLoaderForError();
        }

        function showLoaderForError() {
            var loader = document.getElementById('loader');
            var logs = document.getElementById('survival-logs');
            if (loader) { loader.style.opacity = '1'; loader.style.pointerEvents = 'auto'; }
            if (logs) logs.style.display = 'block';
        }

        window.Link = function(p) { return React.createElement('a', { href: p.to||'#', style: { color: '#3b82f6' } }, p.children); };
        window.process = { env: { NODE_ENV: 'development' } };

        window.onerror = function(msg, url, line, col, error) {
            var fullMsg = String(msg);
            console.error("[v8.5.1-R] ERROR:", fullMsg, error);
            logToSurvival("ERR: " + fullMsg, 'error');
            var loader = document.getElementById('loader');
            if (loader) {
                loader.style.opacity = '1'; loader.style.pointerEvents = 'auto';
                loader.innerHTML = '<div style="background:#050000; color:#fca5a5; padding:40px; border:1px solid #7f1d1d; border-radius:48px; font-family:sans-serif; max-width:650px; text-align:center; box-shadow: 0 0 100px rgba(239, 68, 68, 0.5);">' +
                                 '<h2 style="color:#ef4444; margin:0 0 10px; font-size:24px;">⛔ ESCUDO v8.5.1-R</h2>' +
                                 '<div style="background:rgba(0,0,0,0.6); padding:20px; border-radius:16px; font-family:monospace; font-size:12px; text-align:left; margin-bottom:25px; border:1px solid rgba(255,255,255,0.05); overflow:auto; max-height:100px;">' + fullMsg + '</div>' +
                                 '<div style="display:flex; justify-content:center; gap:10px;">' +
                                 '<button onclick="window.location.reload()" style="background:#1a1a1a; color:#fff; border:1px solid #333; padding:12px 25px; border-radius:16px; cursor:pointer;">🔄 Reintentar</button>' +
                                 '<button id="fix-btn-851" style="background:#dc2626; color:white; border:none; padding:12px 25px; border-radius:16px; cursor:pointer; font-weight:bold;">🚀 Reparar IA</button>' +
                                 '</div>' +
                                 '</div>';
                var btn = document.getElementById('fix-btn-851');
                if (btn) btn.onclick = function() { window.parent.postMessage({ type: 'ask-ai-fix', error: fullMsg, file: 'App.tsx' }, '*'); btn.innerHTML = "⏳ Enviando..."; };
            }
            return false;
        };

        var files = {}; try { files = JSON.parse(document.getElementById('files-data').textContent); } catch(e) {}
        var modules = {}; var loadedModules = {};

        var OMNI_SYMBOL = Symbol('isOmniProxy');
        function createOmniProxy(name, initial) {
            if (initial && (initial[OMNI_SYMBOL] || initial.$$typeof)) return initial;
            var Mock = function() { 
                console.warn("[v8.5.1-R Omni] Placeholder: " + name); 
                return React.createElement('div', { 
                    style: { padding: '10px', border: '1px dashed #333', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: '#444', fontSize: '10px' } 
                }, "Comp: " + name);
            };
            var t = initial || Mock;
            return new Proxy(t, {
                get: (target, key) => {
                    if (key === OMNI_SYMBOL) return true;
                    if (key === '__esModule') return true;
                    if (key === 'default') return createOmniProxy(name, target.default || target);

                    // 1. INVARIANT PROTECTION & EXACT MATCH
                    var desc;
                    try { desc = Object.getOwnPropertyDescriptor(target, key); } catch(e) {}
                    if (desc && !desc.configurable) {
                        if (!desc.writable || desc.get) return target[key];
                    }

                    var val = target[key];
                    // 2. PASSIVE RESILIENCE: If property exists, return it raw (unless it's a hook/store result)
                    if (val !== undefined && val !== null) {
                        // Only wrap function results, not properties themselves to avoid React internal crashes
                        return val;
                    }

                    // 3. Fuzzy Match (Case Insensitive)
                    if (typeof key === 'string') {
                        var k = key.toLowerCase();
                        var found = Object.keys(target).find(x => x.toLowerCase() === k);
                        if (found) return target[found];
                    }

                    // 4. ACTIVE RESILIENCE: Fallbacks for MISSING methods (like .reduce)
                    var safeMethods = {
                        'reduce': function(cb, init) { return init !== undefined ? init : createOmniProxy(name+".reduce"); },
                        'map': function() { return []; }, 'filter': function() { return []; }, 'forEach': function() { },
                        'find': function() { return undefined; }, 'some': function() { return false; }, 'every': function() { return true; },
                        'includes': function() { return false; }, 'slice': function() { return []; }, 'join': function() { return ""; }
                    };
                    if (safeMethods[key]) return safeMethods[key];
                    if (key === 'length') return 0;
                    
                    // 5. Check if the property actually exists on the target before infinite proxying (Crucial for named exports like useStore)
                    if (key in target && target[key] !== undefined) {
                        var original = target[key];
                        // If it's a function extracted via destructuring (e.g. (0, _useStore2.useStore)()), 
                        // we must ensure it remains callable without losing context or crashing.
                        if (typeof original === 'function' && !original[OMNI_SYMBOL] && !original.$$typeof) {
                            return createOmniProxy(name + "." + String(key), original.bind(target));
                        }
                        return original;
                    }

                    // 6. Final Infinite Proxy (SKIP INTERNALS $)
                    if (typeof key === 'string' && !key.startsWith('$$') && !key.startsWith('_') && key !== 'prototype') {
                        return createOmniProxy(name + "." + key);
                    }
                    return target[key];
                },
                apply: (target, thisArg, args) => {
                    // ESM INTEROP FAIL-SAFE: If the requested property is NOT a function (e.g. useStore)
                    // check if the default export (or the target itself if it's a proxy wrapper) IS a function.
                    var fn = (typeof target === 'function') ? target : (target && target.default && typeof target.default === 'function' ? target.default : null);
                    
                    if (!fn) {
                        console.warn("[v8.5.1-R Omni] Non-callable target:", name);
                        return createOmniProxy(name + "()");
                    }
                    try { 
                        var res = fn.apply(thisArg, args); 
                        if (res && (typeof res === 'object' || typeof res === 'function') && !res.$$typeof) {
                            if (name.toLowerCase().includes('context') || name.toLowerCase().includes('react')) return res;
                            return createOmniProxy(name + "()", res);
                        }
                        return res;
                    } catch (e) {
                        console.error("[OmniShield] Call Error", name, e);
                        return createOmniProxy(name + "()");
                    }
                }
            });
        }

        function require(p, f) {
            if (p === 'react' || p === 'react-is') return createOmniProxy(p, window.React);
            if (p === 'react-dom' || p === 'react-dom/client') {
                var rd = window.ReactDOM;
                if (rd && !rd.render && rd.createRoot) rd.render = function(e, c) { if(!c) return; if(!c._r) c._r = rd.createRoot(c); c._r.render(e); };
                return createOmniProxy(p, rd);
            }
            if (p === 'react/jsx-runtime') return createOmniProxy(p, { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment });

            var ecosystem = {
                'react-router-dom': window.ReactRouterDOM, 'react-router': window.ReactRouterDOM,
                'framer-motion': window.Motion || window.framerMotion, 'zustand': window.zustand,
                '@tanstack/react-query': window.ReactQuery, 'lucide-react': window.lucide
            };

            if (ecosystem[p]) {
                var l = ecosystem[p];
                
                // Specific Zustand handling to ensure 'create' is always available 
                // regardless of whether the CDN exposed it as a default function or an object property.
                if (p === 'zustand' && l) {
                    var createFn = typeof l === 'function' ? l : (l.create || l.default || (function() { return createOmniProxy('zustand.create'); }));
                    return createOmniProxy(p, Object.assign({}, l, {
                        create: createFn,
                        default: createFn
                    }));
                }

                if (p === 'framer-motion' && l) {
                    var m = l.motion || l;
                    var mp = new Proxy(m, { get: (t, k) => t[k] || createOmniProxy('motion.'+k) });
                    return createOmniProxy(p, Object.assign({}, l, { motion: mp, default: mp }));
                }
                if (p === 'lucide-react' && l && l.icons) {
                    var ip = new Proxy({}, { get: (t, n) => {
                        if (n === '__esModule') return true; if (n === 'default') return t;
                        const icon = l.icons[n.toString().replace(/Icon$/, '')];
                        return (props={}) => {
                            if (!icon) return React.createElement('span', null);
                            const children = icon.map((item, i) => React.createElement(item[0], { key: i, ...item[1] }));
                            return React.createElement('svg', { width: props?.size||24, height: props?.size||24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props }, children);
                        };
                    }});
                    return createOmniProxy(p, ip);
                }
                return createOmniProxy(p, l);
            }

            if (p.startsWith('@radix-ui/react-')) {
                var RadixMock = React.forwardRef(function(props, ref) {
                    if (props.asChild && props.children) {
                        var child = React.Children.only(props.children);
                        return React.cloneElement(child, Object.assign({}, props, child.props, {
                            className: [props.className, child.props.className].filter(Boolean).join(' '),
                            ref: ref || child.ref
                        }));
                    }
                    var p2 = Object.assign({}, props); delete p2.asChild;
                    return React.createElement('div', Object.assign({}, p2, {ref: ref}), props.children);
                });
                return createOmniProxy(p, { 
                    Slot: RadixMock, Root: RadixMock, Item: RadixMock, Trigger: RadixMock, 
                    Content: RadixMock, Portal: React.Fragment, Label: RadixMock, 
                    Value: RadixMock, Indicator: RadixMock, Separator: RadixMock 
                });
            }

            if (p === 'sonner') return createOmniProxy(p, { toast: createOmniProxy('toast') });
            if (p === 'clsx' || p === 'tailwind-merge' || p === 'class-variance-authority' || p.includes('utils')) {
                var cn = function() { return Array.from(arguments).flat().filter(Boolean).join(' '); };
                return createOmniProxy(p, { default: cn, clsx: cn, twMerge: cn, cn: cn, cva: ()=>()=>'', cx: cn });
            }

            var res = (function resolve(path, from) {
                var p = path; if (p.startsWith('@/')) p = p.replace('@/', 'src/');
                if (p.startsWith('./') || p.startsWith('../')) {
                    var parts = from.split('/'); parts.pop(); var rel = p.split('/');
                    for (var i=0; i<rel.length; i++) { if (rel[i] === '.') continue; if (rel[i] === '..') parts.pop(); else parts.push(rel[i]); }
                    p = parts.join('/');
                }
                if (files[p]) return p;
                var norm = p.replace('src/src/', 'src/').replace('src/pages/pages/', 'src/pages/');
                if (files[norm]) return norm;
                var exts = ['.tsx', '.ts', '.jsx', '.js'];
                for (var i=0; i<exts.length; i++) if (files[p + exts[i]]) return p + exts[i];
                for (var i=0; i<exts.length; i++) if (files[norm + exts[i]]) return norm + exts[i];
                return null;
            })(p, f);

            if (!res && (p.startsWith('.') || p.startsWith('@/'))) {
                window.parent.postMessage({ type: 'runtime-error', message: "No se encontró el módulo: " + p, file: f }, '*');
            }

            if (res) {
                if (loadedModules[res]) return loadedModules[res];
                if (typeof modules[res] !== 'function') {
                    // ESM Asset support: Return raw string for images/uploads
                    if (res.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) || res.includes('lovable-uploads')) {
                        return files[res];
                    }
                    return createOmniProxy(res);
                }
                var m = { exports: {} }; loadedModules[res] = m.exports;
                try { 
                    modules[res](function(x){return require(x, res);}, m, m.exports); 
                    return createOmniProxy(res, m.exports); 
                }
                catch(e) { 
                    window.parent.postMessage({ type: 'runtime-error', message: e.message, file: res, stack: e.stack }, '*');
                    return createOmniProxy(res); 
                }
            }
            return createOmniProxy(p);
        }

        function mountEnvOptions() {
            var envFiles = Object.keys(files).filter(k => k === '.env' || k === '.env.local');
            var envMock = {};
            envFiles.forEach(f => {
                var content = files[f] || '';
                content.split('\\n').forEach(line => {
                    var match = line.match(/^([A-Z0-9_]+)=(.+)$/i);
                    if (match) envMock[match[1]] = match[2].trim().replace(/^[\"']|[\"']$/g, '');
                });
            });
            window.__VITE_ENV_MOCK__ = envMock;
        }

        function start() {
            mountEnvOptions();
            Object.keys(files).forEach(p => {
                if (!p.match(/\\.(tsx|ts|jsx|js)$/)) return;
                try {
                    var codeToTranspile = files[p].replace(/import\.meta\.env/g, 'window.__VITE_ENV_MOCK__');
                    var r = Babel.transform(codeToTranspile, { 
                        presets: [['react', { runtime: 'classic' }], 'typescript', ['env', { modules: 'commonjs' }]], 
                        filename: p 
                    });
                    modules[p] = new Function('require', 'module', 'exports', r.code);
                } catch(e) { console.error("Syntax Error", p, e); }
            });
            finish();
        }

        function finish() {
            var keys = Object.keys(files);
            var entry = keys.find(x => x.match(/main\\.tsx$|index\\.tsx$|src\\/main\\.tsx$|src\\/index\\.tsx$/i));
            var appPath = keys.find(x => x.match(/App\\.tsx$/i));
            try {
                var container = document.getElementById('root');
                if (entry) require(entry, entry);
                else if (appPath) {
                    var mod = require(appPath, appPath);
                    var App = mod && (mod.default || (typeof mod === 'function' ? mod : null));
                    if (App) {
                        if (window.ReactDOM.createRoot) window.ReactDOM.createRoot(container).render(React.createElement(App, null));
                        else window.ReactDOM.render(React.createElement(App, null), container);
                    }
                }
                document.getElementById('loader').style.opacity = '0';
                document.getElementById('loader').style.pointerEvents = 'none';
            } catch(e) { window.onerror("Boot v8.5.1-R: " + e.message, "boot", 0, 0, e); }
        }

        if (sessionStorage.getItem('visor_cdn_ok_851r')) start();
        else {
            var checkCount = 0;
            var check = setInterval(function() {
                checkCount++;
                var ok = window.React && window.ReactDOM && window.Babel && window.lucide && window.Motion && window.ReactRouterDOM && window.zustand;
                if (ok) { clearInterval(check); sessionStorage.setItem('visor_cdn_ok_851r', 'true'); start(); }
                else if (checkCount > 150) { clearInterval(check); start(); }
                else if (checkCount > 20) { showLoaderForError(); logToSurvival("Restaurando Entorno v8.5.1...", 'info'); }
            }, 100);
        }
    })();
`;
