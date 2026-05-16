/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Save, 
  History as HistoryIcon, 
  Download, 
  Settings, 
  User, 
  LogOut, 
  Github,
  Monitor,
  Maximize2,
  Copy,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { NeoConfig, Preset, HistoryEntry } from './types.ts';
import html2canvas from 'html2canvas';

const DEFAULT_CONFIG: NeoConfig = {
  size: 300,
  radius: 50,
  distance: 20,
  intensity: 0.15,
  blur: 60,
  color: '#0d0d0d',
  gradient: false,
  shape: 'flat',
  glassmorphism: true,
  glassBlur: 10,
  glassOpacity: 0.1
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [config, setConfig] = useState<NeoConfig>(DEFAULT_CONFIG);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'presets' | 'history'>('presets');
  const previewRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // Fetch Data when user changes
  useEffect(() => {
    if (!user) {
      setPresets([]);
      setHistory([]);
      return;
    }

    const presetsQuery = query(
      collection(db, 'presets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const historyQuery = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribePresets = onSnapshot(presetsQuery, (snapshot) => {
      setPresets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Preset)));
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry)));
    });

    return () => {
      unsubscribePresets();
      unsubscribeHistory();
    };
  }, [user]);

  // Save to history when config settles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG)) {
        addDoc(collection(db, 'history'), {
          userId: user.uid,
          config,
          timestamp: Timestamp.now()
        });
      }
    }, 2000); // Debounce history saves
    return () => clearTimeout(timer);
  }, [config, user]);

  const savePreset = async () => {
    if (!user) {
      alert('Please login to save presets');
      return;
    }
    const name = prompt('Nome do preset:');
    if (!name) return;

    try {
      await addDoc(collection(db, 'presets'), {
        userId: user.uid,
        name,
        config,
        createdAt: Timestamp.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'presets', id));
    } catch (e) {
      console.error(e);
    }
  };

  const exportPng = async () => {
    if (previewRef.current) {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = 'neoforge-design.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const getNeumorphicStyles = () => {
    const { distance, blur, intensity, radius, color, shape, glassmorphism, glassBlur, glassOpacity } = config;
    
    // Simple color darkening/lightening for shadows
    const darkness = intensity * 100;
    const shadow1 = `rgba(0, 0, 0, ${intensity})`;
    const shadow2 = `rgba(255, 255, 255, ${intensity / 2.5})`;

    let boxShadow = '';
    if (shape === 'flat') {
      boxShadow = `${distance}px ${distance}px ${blur}px ${shadow1}, -${distance}px -${distance}px ${blur}px ${shadow2}`;
    } else if (shape === 'pressed') {
      boxShadow = `inset ${distance}px ${distance}px ${blur}px ${shadow1}, inset -${distance}px -${distance}px ${blur}px ${shadow2}`;
    }

    const glassStyle: React.CSSProperties = glassmorphism ? {
      backgroundColor: `rgba(255, 255, 255, ${glassOpacity})`,
      backdropFilter: `blur(${glassBlur}px)`,
      WebkitBackdropFilter: `blur(${glassBlur}px)`,
      border: '1px solid rgba(255, 255, 255, 0.05)',
    } : {
      backgroundColor: color,
    };

    return {
      width: config.size,
      height: config.size,
      borderRadius: `${radius}%`,
      boxShadow,
      transition: 'all 0.3s ease',
      ...glassStyle,
    };
  };

  return (
    <div className="flex h-screen w-full bg-[#08090b] font-sans text-slate-300 flex-col overflow-hidden select-none">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 glass-panel z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 neo-surface flex items-center justify-center text-sky-400 font-bold italic">
            NF
          </div>
          <span className="font-bold tracking-tighter text-xl text-white">NEOFORGE <span className="text-sky-500 font-light">UI</span></span>
        </div>
        
        <div className="flex items-center gap-6">
          {!user ? (
            <button 
              onClick={loginWithGoogle}
              className="px-4 py-2 neo-surface text-xs font-semibold text-white bg-sky-500/10 flex items-center gap-2 hover:bg-sky-500/20 transition-all"
            >
              <User className="w-4 h-4" /> Entrar com Google
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-white uppercase tracking-wider">{user.displayName}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Synced to Cloud</div>
                </div>
                <div className="w-10 h-10 rounded-full neo-surface p-1">
                  <img src={user.photoURL || ''} alt="" className="w-full h-full rounded-full border border-white/10" />
                </div>
              </div>
              <button onClick={logout} className="p-2 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Presets */}
        <aside className="w-64 border-r border-white/5 p-4 flex flex-col gap-4 shrink-0 bg-[#08090b]">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Local Presets</h3>
          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
            {presets.length === 0 && (
              <div className="py-8 text-center opacity-30">
                <Sparkles className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[10px] uppercase tracking-widest">Nenhum preset</p>
              </div>
            )}
            {presets.map((preset) => (
              <div 
                key={preset.id} 
                onClick={() => setConfig(preset.config)}
                className="group p-3 neo-surface flex flex-col gap-2 border-l-2 border-transparent hover:border-sky-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{preset.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deletePreset(preset.id!); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase">Config v1.0</span>
              </div>
            ))}
            
            <div 
              onClick={savePreset}
              className="p-3 neo-inset text-slate-500 text-center text-xs py-4 border-dashed border border-white/10 cursor-pointer hover:text-sky-400 transition-all"
            >
              + Create New Preset
            </div>
          </div>
          
          <div className="p-4 neo-surface bg-sky-500/5 border border-sky-500/20 rounded-xl">
            <p className="text-xs text-sky-300 leading-relaxed">
              NeoForge AI suggests: <br/>
              <span className="text-slate-400">Try decreasing shadow blur for a sharper look.</span>
            </p>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-[#0b0d11] relative flex flex-col items-center justify-center overflow-hidden">
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
          />
          
          <div className="relative group" ref={previewRef}>
            {/* Glow effect */}
            <div className="absolute -inset-24 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-sky-500/10 transition-all duration-1000" />
            
            <div style={getNeumorphicStyles()} className="relative z-10 flex items-center justify-center neo-surface">
               <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 flex items-center justify-center"
                >
                  <div className="w-4 h-4 bg-sky-500 rounded-full forge-glow"></div>
                </motion.div>
            </div>
          </div>

          {/* Floating Export Control */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            <button 
              onClick={exportPng}
              className="px-6 py-3 neo-surface text-xs font-bold text-sky-400 flex items-center gap-2 hover:bg-sky-500/5 transition-all"
            >
              <Download className="w-4 h-4" />
              EXPORT AS PNG
            </button>
            <button 
              onClick={savePreset}
              className="px-6 py-3 neo-surface text-xs font-bold text-white bg-sky-600 flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all"
            >
              <Save className="w-4 h-4" />
              SAVE DESIGN
            </button>
          </div>
        </main>

        {/* Right Sidebar: Properties */}
        <aside className="w-80 border-l border-white/5 p-6 space-y-8 glass-panel overflow-y-auto custom-scrollbar shrink-0">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Geometry Forge</h3>
            <div className="space-y-6">
              {[
                { label: 'Tamanho', key: 'size', min: 100, max: 600, unit: 'px' },
                { label: 'Arredondamento', key: 'radius', min: 0, max: 50, unit: '%' },
                { label: 'Distância', key: 'distance', min: 5, max: 50, unit: 'px' },
                { label: 'Suavidade', key: 'blur', min: 0, max: 150, unit: 'px' },
                { label: 'Intensidade', key: 'intensity', min: 0.01, max: 0.3, step: 0.01, unit: '%', multiplier: 100 },
              ].map((control) => (
                <div key={control.key} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-medium">
                    <label className="text-slate-400 uppercase tracking-wider">{control.label}</label>
                    <span className="text-sky-400 font-mono">
                      {control.multiplier ? (config[control.key as keyof NeoConfig] as number * control.multiplier).toFixed(0) : config[control.key as keyof NeoConfig]}
                      {control.unit}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min={control.min} 
                    max={control.max} 
                    step={control.step || 1}
                    value={config[control.key as keyof NeoConfig] as number}
                    onChange={(e) => setConfig({ ...config, [control.key]: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Material & Color</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl neo-surface overflow-hidden border border-white/10 p-1 shrink-0">
                  <input 
                    type="color" 
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Base Color</label>
                  <input 
                    type="text" 
                    value={config.color.toUpperCase()}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 text-xs font-mono py-1 focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Shaping</h3>
             <div className="grid grid-cols-2 gap-3">
                {(['flat', 'pressed'] as const).map((s) => (
                  <button 
                    key={s}
                    onClick={() => setConfig({ ...config, shape: s })}
                    className={`py-3 neo-surface text-[10px] uppercase font-bold tracking-widest border transition-all ${config.shape === s ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    {s === 'flat' ? 'Plano' : 'Pressionado'}
                  </button>
                ))}
             </div>
          </div>

          <div className="pt-6 border-t border-white/5">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Glassmorphism</span>
                <button 
                  onClick={() => setConfig({ ...config, glassmorphism: !config.glassmorphism })}
                  className={`w-10 h-5 rounded-full transition-all relative ${config.glassmorphism ? 'bg-sky-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config.glassmorphism ? 'left-5.5' : 'left-0.5'}`} />
                </button>
             </div>
             {config.glassmorphism && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px]">
                      <label className="text-slate-400">Glass Blur</label>
                      <span className="text-sky-400 font-mono">{config.glassBlur}px</span>
                    </div>
                    <input type="range" min="0" max="40" value={config.glassBlur} onChange={(e) => setConfig({ ...config, glassBlur: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px]">
                      <label className="text-slate-400">Glass Opacity</label>
                      <span className="text-sky-400 font-mono">{(config.glassOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0.01" max="0.5" step="0.01" value={config.glassOpacity} onChange={(e) => setConfig({ ...config, glassOpacity: parseFloat(e.target.value) })} className="w-full" />
                  </div>
               </motion.div>
             )}
          </div>

          <div className="pt-6 border-t border-white/5">
            <div 
              onClick={() => {
                const styles = getNeumorphicStyles();
                const css = `border-radius: ${styles.borderRadius};\nbox-shadow: ${styles.boxShadow};\nbackground: ${styles.backgroundColor};\nbackdrop-filter: ${styles.backdropFilter};`;
                navigator.clipboard.writeText(css);
                alert('CSS Copiado!');
              }}
              className="p-4 neo-inset text-center cursor-pointer group hover:bg-white/5 transition-all"
            >
              <span className="text-[9px] text-slate-500 tracking-wider uppercase group-hover:text-sky-400 transition-colors">HEX CODE / COPY CSS</span>
              <div className="text-lg font-mono text-white flex items-center justify-center gap-2">
                {config.color.toUpperCase()} <Copy className="w-3 h-3 text-slate-500" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Bar: History */}
      <footer className="h-24 border-t border-white/5 bg-black/40 flex items-center px-6 gap-6 shrink-0 z-10">
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-[9px] text-slate-500 uppercase tracking-tighter mb-2 font-bold">Session History</span>
          <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
            {history.length === 0 && <span className="text-[10px] text-slate-700 italic">No history yet...</span>}
            {history.map((item, idx) => (
              <div 
                key={item.id || idx}
                onClick={() => setConfig(item.config)}
                className="shrink-0 w-12 h-12 neo-surface bg-slate-900 flex items-center justify-center text-[10px] text-slate-600 hover:text-sky-400 hover:border-sky-500 cursor-pointer transition-all border border-transparent"
              >
                T-{String(history.length - idx).padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-8 items-center h-full border-l border-white/5 pl-8 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AUTO-SAVE</div>
            <div className="text-[10px] text-sky-400 font-mono">STATUS: {user ? 'CLOUD SYNCED' : 'LOCAL ONLY'}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-xs font-bold tracking-widest text-white">LIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

