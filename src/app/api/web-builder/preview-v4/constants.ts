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
        console.log("[v8.5.2-Z] Classic OmniShield Active");

        // PROJECT ISOLATION: Clean boot for new projects
        if (!sessionStorage.getItem('visor_project_isolated_v852_final')) {
            console.log("%c [v8.5.2-Z] PURGE: Resetting local environment for stability... ", "background: #7f1d1d; color: #fff; font-weight: bold;");
            localStorage.clear(); // Total purge to remove poisoned keys like 'vropa-cart-storage'
            sessionStorage.setItem('visor_project_isolated_v852_final', 'true');
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
            window.__visor_last_msg = fullMsg;
            window.__visor_last_err = error;
            console.error("[v8.5.2-Z] ERROR:", fullMsg, error);
            logToSurvival("ERR: " + fullMsg, 'error');
            var loader = document.getElementById('loader');
            if (loader) {
                loader.style.opacity = '1'; loader.style.pointerEvents = 'auto';
                loader.style.display = 'flex'; loader.style.inset = '0'; loader.style.position = 'fixed';
                loader.style.background = '#000'; loader.style.borderRadius = '0';
                loader.style.width = '100vw'; loader.style.height = '100vh';
                loader.innerHTML = '<div style="background:#050000; color:#fca5a5; padding:40px; border:1px solid #7f1d1d; border-radius:48px; font-family:sans-serif; max-width:650px; text-align:center; box-shadow: 0 0 100px rgba(239, 68, 68, 0.5); position:relative;">' +
                                 '<button onclick="window.__visor_minimize()" style="position:absolute; top:-10px; right:-10px; background:#ef4444; color:white; border:none; width:30px; height:30px; border-radius:15px; cursor:pointer; font-weight:bold; display:flex; items-center; justify-content:center; box-shadow:0 5px 15px rgba(0,0,0,0.5);">×</button>' +
                                 '<h2 style="color:#ef4444; margin:0 0 10px; font-size:24px;">⛔ ERROR DE EJECUCIÓN</h2>' +
                                 '<div style="background:rgba(0,0,0,0.6); padding:20px; border-radius:16px; font-family:monospace; font-size:12px; text-align:left; margin-bottom:25px; border:1px solid rgba(255,255,255,0.05); overflow:auto; max-height:100px;">' + fullMsg + '</div>' +
                                 '<div style="display:flex; justify-content:center; gap:10px;">' +
                                 '<button onclick="window.location.reload()" style="background:#1a1a1a; color:#fff; border:1px solid #333; padding:12px 25px; border-radius:16px; cursor:pointer;">🔄 Reintentar</button>' +
                                 '<button id="fix-btn-851" style="background:#dc2626; color:white; border:none; padding:12px 25px; border-radius:16px; cursor:pointer; font-weight:bold;">🚀 Solicitar Corrección a IA</button>' +
                                 '</div>' +
                                 '</div>';
                var btn = document.getElementById('fix-btn-851');
                if (btn) btn.onclick = function() { window.parent.postMessage({ type: 'ask-ai-fix', error: fullMsg, file: 'App.tsx' }, '*'); btn.innerHTML = "⏳ Enviando..."; };
            }
            return false;
        };

        window.__visor_minimize = function() {
            var loader = document.getElementById('loader');
            if (loader) {
                loader.style.all = 'unset';
                loader.style.position = 'fixed';
                loader.style.top = '20px';
                loader.style.right = '20px';
                loader.style.width = '50px';
                loader.style.height = '50px';
                loader.style.borderRadius = '25px';
                loader.style.background = 'rgba(239, 68, 68, 0.9)';
                loader.style.display = 'flex';
                loader.style.alignItems = 'center';
                loader.style.justifyContent = 'center';
                loader.style.cursor = 'pointer';
                loader.style.zIndex = '999999';
                loader.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.4)';
                loader.style.border = '2px solid rgba(255,255,255,0.2)';
                loader.innerHTML = '<span style="font-size:24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛡️</span>';
                loader.title = "Click para ver error";
                loader.onclick = function() {
                    window.onerror(window.__visor_last_msg, "boot", 0, 0, window.__visor_last_err);
                };
            }
        };

        var files = {}; try { files = JSON.parse(document.getElementById('files-data').textContent); } catch(e) {}
        var modules = {}; var loadedModules = {};

        var OMNI_SYMBOL = Symbol('isOmniProxy');
        function createOmniProxy(name, initial) {
            if (initial && (initial[OMNI_SYMBOL] || initial.$$typeof)) return initial;
            var Mock = function(props) { 
                // SILENT MOCK: Structural components (Trigger, Content, Portal, Slot, etc)
                // should just render their children to avoid UI clutter.
                var n = name.toLowerCase();
                var isStructural = n.includes('trigger') || n.includes('content') || n.includes('portal') || 
                                 n.includes('slot') || n.includes('root') || n.includes('item') ||
                                 n.includes('viewport') || n.includes('scroll') || n.includes('indicator') ||
                                 n.includes('icon');

                if (isStructural) {
                    return props && props.children ? props.children : null;
                }

                console.warn("[v8.5.2-Z Omni] Placeholder: " + name); 
                return React.createElement('div', { 
                    style: { 
                        display: 'inline-flex',
                        padding: '2px 6px',
                        fontSize: '10px',
                        color: '#71717a',
                        border: '1px dashed #e4e4e7',
                        borderRadius: '4px',
                        margin: '1px',
                        opacity: 0.7
                    } 
                }, '· ' + name.split('.').pop());
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
                        // If the target is a simple value (like a CSS string), don't proxy deeper
                        if (typeof target !== 'object' && typeof target !== 'function') return target;
                        return createOmniProxy(name + "." + key);
                    }
                    return target[key];
                },
                apply: (target, thisArg, args) => {
                    // ESM INTEROP FAIL-SAFE: If the requested property is NOT a function (e.g. useStore)
                    // check if the default export (or the target itself if it's a proxy wrapper) IS a function.
                    var fn = (typeof target === 'function') ? target : (target && target.default && typeof target.default === 'function' ? target.default : null);
                    
                    if (!fn) {
                        console.warn("[v8.5.2-Z Omni] Non-callable target:", name);
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
                '@tanstack/react-query': window.ReactQuery, 'lucide-react': window.lucide,
                'firebase/app': window.firebase, 'firebase/auth': window.firebase, 'firebase/firestore': window.firebase
            };

            // ─── ZUSTAND: Handled BEFORE ecosystem map (CDN UMD crashes on load due to ───
            // useSyncExternalStoreWithSelector being undefined, so window.zustand is NEVER set)
            if (p === 'zustand/middleware') {
                var zMiddleware = {
                    createJSONStorage: function(getStorage) {
                        var storage = { getItem: function(){return null;}, setItem: function(){}, removeItem: function(){} };
                        try { storage = typeof getStorage === 'function' ? getStorage() : localStorage; } catch(e){}
                        return {
                            getItem: function(name) { try { var v = storage.getItem(name); return v ? JSON.parse(v) : null; } catch(e){ return null; } },
                            setItem: function(name, value) { try { storage.setItem(name, JSON.stringify(value)); } catch(e){} },
                            removeItem: function(name) { try { storage.removeItem(name); } catch(e){} }
                        };
                    },
                    persist: function(config, options) {
                        return function(set, get, api) {
                            var storeName = (options && options.name) || 'zustand-store';
                            var storage = { getItem: function(){return null;}, setItem: function(){}, removeItem: function(){} };
                            try { storage = { getItem: function(n) { try { var v = localStorage.getItem(n); return v ? JSON.parse(v) : null; } catch(e){ return null; } }, setItem: function(n, v) { try { localStorage.setItem(n, JSON.stringify(v)); } catch(e){} }, removeItem: function(n) { try { localStorage.removeItem(n); } catch(e){} } }; } catch(e){}
                            if (options && options.storage) storage = options.storage;
                            var persistedSet = function(partial, replace) { set(partial, replace); try { storage.setItem(storeName, get ? get() : {}); } catch(e){} };
                            var state = config(persistedSet, get, api);
                            try { var persisted = storage.getItem(storeName); if (persisted && typeof persisted === 'object') Object.assign(state, persisted); } catch(e){}
                            return state;
                        };
                    },
                    subscribeWithSelector: function(config) { return config; },
                    devtools: function(config) { return config; },
                    immer: function(config) { return config; },
                    combine: function(initial, creator) { return function(set, get, api) { return Object.assign({}, initial, creator(set, get, api)); }; }
                };
                return createOmniProxy(p, zMiddleware);
            }

            if (p === 'zustand') {
                // Pure-JS Zustand create implementation (CDN UMD is unreliable — crashes on useSyncExternalStoreWithSelector)
                var zustandCreate = function(creatorOrMiddleware) {
                    // Logic to handle curried form: create<T>()(...)
                    if (creatorOrMiddleware === undefined) {
                        return function(actualCreator) { return zustandCreate(actualCreator); };
                    }

                    // Store core logic
                    return (function(creator) {
                        var stateHolder = { current: {} }; // Initialize with empty object to prevent null get()
                        var subscribers = [];

                        var set = function(partial, replace) {
                            var next = typeof partial === 'function' ? partial(stateHolder.current) : partial;
                            if (replace) { stateHolder.current = next; }
                            else { stateHolder.current = Object.assign({}, stateHolder.current, next); }
                            subscribers.forEach(function(s){ try { s(stateHolder.current); } catch(e){} });
                        };
                        var get = function() { return stateHolder.current; };
                        var api = { getState: get, setState: set, subscribe: function(fn) { subscribers.push(fn); return function() { subscribers = subscribers.filter(function(s){ return s !== fn; }); }; }, destroy: function() { subscribers = []; } };

                        // creator might be a persist-wrapped function (returns a function),
                        // or a direct state creator (returns an object)
                        var created = typeof creator === 'function' ? creator(set, get, api) : creator;
                        
                        // Merge created state into the holder (ensures object reference stability)
                        Object.assign(stateHolder.current, created || {});

                        // The actual hook used in components
                        var hook = function(selector) {
                            // React-compatible mock (minimal)
                            var [s, ss] = React.useState(selector ? selector(stateHolder.current) : stateHolder.current);
                            React.useLayoutEffect(() => {
                                return api.subscribe(() => { ss(selector ? selector(stateHolder.current) : stateHolder.current); });
                            }, []);
                            return s;
                        };
                        hook.getState = get;
                        hook.setState = set;
                        hook.subscribe = api.subscribe;
                        hook.destroy = api.destroy;
                        return hook;
                    })(creatorOrMiddleware);
                };
                return createOmniProxy(p, { create: zustandCreate, default: zustandCreate });
            }

            if (ecosystem[p]) {
                var l = ecosystem[p];

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
                        try {
                            var child = React.Children.only(props.children);
                            return React.cloneElement(child, Object.assign({}, props, child.props, {
                                className: [props.className, child.props.className].filter(Boolean).join(' '),
                                ref: ref || child.ref
                            }));
                        } catch(e) { return props.children; }
                    }
                    var p2 = Object.assign({}, props); delete p2.asChild;
                    // If it's a structural component from Radix, just render children
                    return React.createElement(props.as ? props.as : 'div', Object.assign({}, p2, {ref: ref}), props.children);
                });
                return createOmniProxy(p, { 
                    Slot: RadixMock, Root: RadixMock, Item: RadixMock, Trigger: RadixMock, 
                    Content: RadixMock, Portal: React.Fragment, Label: RadixMock, 
                    Value: RadixMock, Indicator: RadixMock, Separator: RadixMock,
                    Viewport: React.Fragment, ScrollUpButton: React.Fragment, ScrollDownButton: React.Fragment,
                    Icon: React.Fragment, Arrow: React.Fragment, Close: RadixMock
                });
            }

            if (p === 'sonner') {
                var Toaster = function() { return React.createElement('div', { id: 'sonner-toaster', style: { display: 'none' } }); };
                var s = { toast: createOmniProxy('toast'), Toaster: Toaster };
                return createOmniProxy(p, Object.assign({}, s, { default: s }));
            }
            if (p === 'recharts') {
                var RM = function(props) { return React.createElement('div', { style: { width: '100%', height: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '10px' } }, "Chart: " + (props?.name || 'Data Visualization')); };
                var rc = { 
                    ResponsiveContainer: function(p) { return React.createElement('div', { style: { width:'100%', height:'100%' } }, p.children); },
                    BarChart: RM, LineChart: RM, PieChart: RM, AreaChart: RM, RadarChart: RM,
                    XAxis: function() { return null; }, YAxis: function() { return null; }, CartesianGrid: function() { return null; },
                    Tooltip: function() { return null; }, Legend: function() { return null; }, Bar: function() { return null; },
                    Line: function() { return null; }, Pie: function() { return null; }, Area: function() { return null; },
                    Cell: function() { return null; }, Radar: function() { return null; }, PolarGrid: function() { return null; }
                };
                return createOmniProxy(p, rc);
            }
            if (p === 'clsx' || p === 'tailwind-merge' || p === 'class-variance-authority' || p.includes('utils')) {
                var cn = function() { return Array.from(arguments).flat().filter(Boolean).join(' '); };
                return createOmniProxy(p, { default: cn, clsx: cn, twMerge: cn, cn: cn, cva: function(){ return function(){ return ""; }; }, cx: cn });
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
                // If it was successfully loaded OR replaced by a Safe Proxy
                if (loadedModules[res]) return loadedModules[res];
                if (typeof modules[res] !== 'function') {
                    // ESM Asset support: Return raw string for images/uploads
                    if (res.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) || res.includes('lovable-uploads')) {
                        return files[res];
                    }
                    return createOmniProxy(res);
                }
                var m = { exports: {} }; 
                // Delay caching until after successful execution to prevent empty object bugs
                try { 
                    modules[res](function(x){return require(x, res);}, m, m.exports); 
                    loadedModules[res] = m.exports; // Cache only if successful
                    return createOmniProxy(res, m.exports); 
                }
                catch(e) { 
                    window.parent.postMessage({ type: 'runtime-error', message: e.message, file: res, stack: e.stack }, '*');
                    
                    // Critical Fix: Store the OmniProxy in the cache so subsequent calls get the resilient proxy
                    var safeProxy = createOmniProxy(res);
                    loadedModules[res] = safeProxy;
                    return safeProxy; 
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
                if (!p.match(/\.(tsx|ts|jsx|js)$/)) return;
                try {
                    var codeToTranspile = files[p].replace(/import\.meta\.env/g, 'window.__VITE_ENV_MOCK__');

                    var r = Babel.transform(codeToTranspile, { 
                        presets: [
                            ['react', { runtime: 'classic', development: true }], 
                            ['typescript', { isTSX: true, allExtensions: true }], 
                            ['env', { modules: 'commonjs', targets: { browsers: ['last 2 versions'] } }]
                        ], 
                        plugins: [],
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
            } catch(e) { window.onerror("Boot v8.5.2-Z: " + e.message, "boot", 0, 0, e); }
        }

        if (sessionStorage.getItem('visor_cdn_ok_852z')) start();
        else {
            var checkCount = 0;
            var check = setInterval(function() {
                checkCount++;
                // Zustand removed — UMD crashes on useSyncExternalStoreWithSelector; handled in pure JS instead
                var ok = window.React && window.ReactDOM && window.Babel && window.lucide && window.Motion && window.ReactRouterDOM;
                if (ok) { clearInterval(check); sessionStorage.setItem('visor_cdn_ok_852z', 'true'); start(); }
                else if (checkCount > 80) { clearInterval(check); start(); }
                else if (checkCount > 40) { showLoaderForError(); logToSurvival("Restaurando Entorno v8.5.2...", 'info'); }
            }, 100);
        }
    })();
`;

