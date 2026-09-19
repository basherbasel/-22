import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Usb, 
  Terminal, 
  ShieldAlert, 
  Database, 
  Settings, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  History,
  FileCode,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import type { HardwareStatus, DeviceInfo, Firmware } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diagnostics' | 'firmware' | 'history'>('dashboard');
  const [hardware, setHardware] = useState<HardwareStatus>({ connected: false, device: null, ports: [] });
  const [logs, setLogs] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHardware();
    const interval = setInterval(fetchHardware, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchHardware = async () => {
    try {
      const res = await fetch('/api/hardware/status');
      const data = await res.json();
      setHardware(data);
    } catch (e) {
      console.error("Hardware polling failed");
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runDiagnostics = async () => {
    setIsAnalyzing(true);
    addLog("ApexAgent initiating deep diagnostic scan...");
    try {
      const res = await fetch('/api/diagnostics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: "ERROR: Partition table corrupt at sector 0x0045A\nBOOT: Bootloop detected on A/B slot transition.",
          deviceInfo: hardware.device
        })
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
      addLog("ApexAgent analysis complete.");
    } catch (e) {
      addLog("Analysis Error: Connection to ApexAgent failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeRepair = async (op: string) => {
    addLog(`Initiating ${op}...`);
    try {
      const res = await fetch('/api/repair/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: op, deviceInfo: hardware.device })
      });
      const data = await res.json();
      data.logs.forEach((l: string) => addLog(l));
    } catch (e) {
      addLog("Repair failed: Command timeout.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex font-sans selection:bg-blue-500/30">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-slate-800 flex flex-col bg-[#0F0F11]">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">APEX LOCAL</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Repair Box v1.0</p>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <NavItem active={activeTab === 'diagnostics'} icon={<Cpu size={20} />} label="Diagnostics" onClick={() => setActiveTab('diagnostics')} />
          <NavItem active={activeTab === 'firmware'} icon={<Database size={20} />} label="Firmware Repository" onClick={() => setActiveTab('firmware')} />
          <NavItem active={activeTab === 'history'} icon={<History size={20} />} label="Repair History" onClick={() => setActiveTab('history')} />
        </div>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Hardware Engine</span>
              <div className={cn("w-2 h-2 rounded-full", hardware.connected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            </div>
            <p className="text-xs font-medium truncate">{hardware.device?.model || "No Device Detected"}</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-semibold">
            <Settings size={14} />
            Workstation Config
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0F0F11]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="capitalize">{activeTab}</span>
            {hardware.device && (
              <>
                <span className="opacity-30">/</span>
                <span className="text-blue-400 font-mono">{hardware.device.sn}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Usb size={14} className="text-blue-400" />
              <span className="font-mono">{hardware.device?.port || "Scanning Ports..."}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-12 gap-8"
              >
                {/* Device Info Card */}
                <div className="col-span-8 space-y-8">
                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Connection Mode" value={hardware.device?.mode || "N/A"} icon={<Usb className="text-blue-400" />} />
                    <StatCard label="Manufacturer" value={hardware.device?.brand || "Searching..."} icon={<ShieldAlert className="text-purple-400" />} />
                    <StatCard label="Health Status" value="Critical" icon={<AlertTriangle className="text-orange-400" />} color="text-orange-400" />
                  </div>

                  {/* Diagnostic Terminal */}
                  <div className="rounded-2xl bg-[#0F0F11] border border-slate-800 overflow-hidden flex flex-col h-[400px] shadow-2xl shadow-black/50">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#151518] border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal size={16} className="text-slate-500" />
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Live Hardware Logs</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed overflow-y-auto scrollbar-hide space-y-1">
                      {logs.length === 0 ? (
                        <p className="text-slate-600 italic">No logs detected. Connect a device via USB to begin...</p>
                      ) : (
                        logs.map((log, i) => (
                          <div key={i} className="flex gap-3 hover:bg-slate-800/30 px-2 py-0.5 rounded transition-colors group">
                            <span className="text-slate-700 shrink-0 tabular-nums">{i + 1}</span>
                            <span className={cn(
                              log.includes('SUCCESS') ? "text-emerald-400" : 
                              log.includes('ERROR') || log.includes('Critical') ? "text-red-400" : 
                              log.includes('SAFETY') ? "text-blue-400" : "text-slate-400"
                            )}>{log}</span>
                          </div>
                        ))
                      )}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="col-span-4 space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-900/20 to-blue-900/10 border border-blue-500/20 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Cpu className="text-blue-400" size={18} />
                      </div>
                      <h3 className="font-semibold text-lg">ApexAgent AI</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      AI-powered diagnostic engine. Analyzes bootlogs and matches firmware automatically.
                    </p>
                    <button 
                      onClick={runDiagnostics}
                      disabled={isAnalyzing || !hardware.connected}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                      {isAnalyzing ? "Analyzing Logs..." : "Start Deep Analysis"}
                      {!isAnalyzing && <Zap size={16} fill="currentColor" />}
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#0F0F11] border border-slate-800 p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 uppercase text-[10px] tracking-widest text-slate-500">
                      Quick Repair Commands
                    </h3>
                    <div className="space-y-2">
                      <RepairButton label="Backup All Partitions" onClick={() => executeRepair("FULL_BACKUP")} disabled={!hardware.connected} />
                      <RepairButton label="Unlock Bootloader" variant="secondary" onClick={() => executeRepair("UNLOCK_BL")} disabled={!hardware.connected} />
                      <RepairButton label="Flash Stock Firmware" variant="primary" onClick={() => executeRepair("FLASH_STOCK")} disabled={!hardware.connected} />
                      <RepairButton label="FRP / Google Lock Bypass" variant="danger" onClick={() => executeRepair("FRP_BYPASS")} disabled={!hardware.connected} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'diagnostics' && aiAnalysis && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Terminal size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">ApexAgent Insights</h2>
                    <p className="text-slate-500 text-sm">Context-aware hardware diagnostic report</p>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-blue max-w-none bg-[#0F0F11] border border-slate-800 p-8 rounded-2xl shadow-xl">
                   <div className="whitespace-pre-wrap font-mono text-sm leading-loose">
                     {aiAnalysis}
                   </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setAiAnalysis(null)}
                    className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    Clear Analysis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
        active 
          ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <span className={cn("transition-colors", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color?: string }) {
  return (
    <div className="flex-1 bg-[#0F0F11] border border-slate-800 p-5 rounded-2xl shadow-lg hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="p-1.5 bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <p className={cn("text-lg font-bold truncate", color || "text-slate-200")}>{value}</p>
    </div>
  );
}

function RepairButton({ label, variant = 'secondary', onClick, disabled }: { label: string, variant?: 'primary' | 'secondary' | 'danger', onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all disabled:opacity-30",
        variant === 'primary' && "bg-blue-600 border-blue-500 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
        variant === 'secondary' && "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300",
        variant === 'danger' && "bg-red-900/20 border-red-800/40 hover:bg-red-900/30 text-red-400"
      )}
    >
      {variant === 'primary' && <CheckCircle2 size={14} />}
      {variant === 'danger' && <ShieldAlert size={14} />}
      {label}
    </button>
  );
}
