"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect, useRef } from "react";
import { Home, Plus, Download, Trash2, Loader2, Coins, User, StickyNote, X, Pencil, Check, LogOut, PieChart as PieChartIcon, Settings, Wallet, Target, Package, DollarSign, Database, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatisticsView } from "./statistics-view";
import { TransactionList } from "./transaction-list";
import { NavigationHub } from "./navigation-hub"; // Import Hub
import { supabase } from "@/lib/supabase";
import { clearAllTransactions, getTransactions, createSheet, deleteSheet, logoutUser, renameSheet, type UnitGoalSettings } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";


// Inside Dashboard component...



export function Dashboard({
  initialSheets = [],
  initialTransactions = [],
  initialGoal = 0,
  initialUnitGoal = null,
  initialUsername = "جاري التحميل..."
}: {
  initialSheets?: string[],
  initialTransactions?: any[],
  initialGoal?: number,
  initialUnitGoal?: any,
  initialUsername?: string
}) {
  // --- Cache Keys ---
  const STORAGE_KEY_DATA = "donations_data_v2";
  const STORAGE_KEY_USER = "donations_user_v1";

  // --- State Initialization ---
  // We initialize with props if available which avoids hydration mismatch. 
  // Cache loading happens in useEffect for client-side speed.
  const [currentSheet, setCurrentSheet] = useState(initialSheets[0] || "Donation");
  const [allSheets, setAllSheets] = useState<string[]>(initialSheets.length > 0 ? initialSheets : ["Donation"]);
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  
  // Goals State
  const [goals, setGoals] = useState<Record<string, number>>({ [initialSheets[0] || "Donation"]: initialGoal });
  const [unitGoals, setUnitGoals] = useState<Record<string, UnitGoalSettings>>({ [initialSheets[0] || "Donation"]: initialUnitGoal });
  
  const [username, setUsername] = useState(initialUsername !== "Unknown" ? initialUsername : "جاري التحميل...");

  // ... (Other UI states like edit mode, modal visibility, etc. kept as is) ...
  const [viewMode, setViewMode] = useState<'list' | 'stats' | 'settings'>('list');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [goalsLoading, setGoalsLoading] = useState<Record<string, boolean>>({});
  
  const longPressTimer = useRef<NodeJS.Timeout>(null);
  const goalDebounce = useRef<NodeJS.Timeout>(null);
  const unitTargetDebounce = useRef<NodeJS.Timeout>(null);
  const unitNameDebounce = useRef<NodeJS.Timeout>(null);
  const unitPriceDebounce = useRef<NodeJS.Timeout>(null);

  // --- 1. Load from Cache & Fetch Fresh Data (Instant Load Logic) ---
  useEffect(() => {
    setMounted(true);
    
    const loadData = async () => {
      // A. Try loading from LocalStorage first (Instant)
      try {
        const cachedData = localStorage.getItem(STORAGE_KEY_DATA);
        const cachedUser = localStorage.getItem(STORAGE_KEY_USER);

        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Apply cache if props were empty (CSR mode) or to ensure latest client state
          if (initialSheets.length === 0) {
            if (parsed.sheets?.length) {
                setAllSheets(parsed.sheets);
                setCurrentSheet(parsed.sheets[0]);
            }
            if (parsed.transactions) setTransactions(parsed.transactions);
            if (parsed.goals) setGoals(parsed.goals);
            if (parsed.unitGoals) setUnitGoals(parsed.unitGoals);
          }
        }
        
        if (cachedUser && initialUsername === "جاري التحميل...") {
             setUsername(cachedUser);
        }
      } catch (e) {
        console.error("Cache load error", e);
      }

      // B. Fetch Fresh Data (Background)
      try {
        // 1. Fetch User
        import("@/app/actions").then(async ({ getUserProfile, getSheets, getTransactions, getCategoryGoal, getUnitGoal }) => {
            if (initialUsername === "جاري التحميل..." || initialUsername === "Unknown") {
                getUserProfile().then(p => {
                    const name = p?.displayName || p?.username || "User";
                    setUsername(name);
                    localStorage.setItem(STORAGE_KEY_USER, name);
                });
            }

            // 2. Fetch Sheets
            const sheets = await getSheets();
            if (sheets.length > 0) {
                setAllSheets(sheets);
                if (!sheets.includes(currentSheet)) setCurrentSheet(sheets[0]);
                
                // 3. Fetch Data for Current Sheet (Optimized)
                // We fetch specific data for the *active* sheet first
                const targetSheet = sheets.includes(currentSheet) ? currentSheet : sheets[0];
                
                const [txs, g, ug] = await Promise.all([
                    getTransactions(targetSheet),
                    getCategoryGoal(targetSheet),
                    getUnitGoal(targetSheet)
                ]);

                setTransactions(txs);
                setGoals(prev => ({ ...prev, [targetSheet]: g }));
                setUnitGoals(prev => ({ ...prev, [targetSheet]: ug || { enabled: false, unitName: "", unitPrice: 0, unitTarget: 0 } }));

                // Update Cache
                const cachePayload = {
                    sheets,
                    transactions: txs, // Note: This only caches current sheet txs, simpler for now
                    goals: { ...goals, [targetSheet]: g },
                    unitGoals: { ...unitGoals, [targetSheet]: ug }
                };
                localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(cachePayload));
            }
        });

      } catch (err) {
        console.error("Background fetch error", err);
      }
    };

    loadData();
  }, []); // Run once on mount

  // ... (Rest of component logic remains similar) ...

  const handleRenameTab = async () => {
    if (!editingTab || !renameValue.trim() || renameValue === editingTab) {
      setEditingTab(null);
      return;
    }

    const oldName = editingTab;
    const newName = renameValue.trim();

    // Optimistic update
    const prevSheets = [...allSheets];
    const newSheets = allSheets.map(s => s === oldName ? newName : s);
    setAllSheets(newSheets);
    if (currentSheet === oldName) setCurrentSheet(newName);
    setEditingTab(null);

    try {
      const res = await renameSheet(oldName, newName);
      if (!res.success) {
        toast.error("فشل في تغيير الاسم");
        setAllSheets(prevSheets);
        if (currentSheet === newName) setCurrentSheet(oldName);
      }
    } catch (e) {
      setAllSheets(prevSheets);
    }
  };

  // Set mounted state for hydration stability
  const isInitialMount = useRef(true);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side Cache
  const [cachedData, setCachedData] = useState<Record<string, any[]>>({
    [initialSheets[0] || "Donation"]: initialTransactions
  });

  const router = useRouter();
  const handleLogout = () => {
    // Fire-and-forget: redirect immediately, server cleans up in background
    window.location.href = "/login"; // Force hard reload to clear cache
    logoutUser(); // No await - runs in background
  };

  const handleGoHome = () => {
    window.location.href = "/"; // Force reload to ensure App Selector loads fresh
  };

  useEffect(() => {
    // Use cached data immediately if available
    if (cachedData[currentSheet]) {
      setTransactions(cachedData[currentSheet]);
    }

    const fetchTransactions = async () => {
      // Skip refetch on initial mount if we already have data from SSR
      if (isInitialMount.current && cachedData[currentSheet]) {
        isInitialMount.current = false;
        return;
      }
      isInitialMount.current = false;

      if (!cachedData[currentSheet]) setLoading(true);

      try {
        const data = await getTransactions(currentSheet);
        setTransactions(data);
        setCachedData(prev => ({ ...prev, [currentSheet]: data }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `category=eq.${currentSheet}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    // Parallel Fetch Goal for SPA experience
    const fetchGoal = async () => {
      if (goals[currentSheet] === undefined) {
        setGoalsLoading(prev => ({ ...prev, [currentSheet]: true }));
        try {
          const { getCategoryGoal } = await import("@/app/actions");
          const g = await getCategoryGoal(currentSheet);
          setGoals(prev => ({ ...prev, [currentSheet]: g }));
        } finally {
          setGoalsLoading(prev => ({ ...prev, [currentSheet]: false }));
        }
      }
    };
    fetchGoal();

    // Fetch Unit Goal
    const fetchUnitGoal = async () => {
      if (unitGoals[currentSheet] === undefined) {
        try {
          const { getUnitGoal } = await import("@/app/actions");
          const ug = await getUnitGoal(currentSheet);
          setUnitGoals(prev => ({ ...prev, [currentSheet]: ug }));
        } catch (e) {
          console.error("Error fetching unit goal:", e);
        }
      }
    };
    fetchUnitGoal();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSheet]);

  const handleCreateTab = () => {
    if (!newTabName.trim()) return;

    const prevSheets = [...allSheets];
    const name = newTabName.trim();
    
    // Optimistic UI: update immediately
    setAllSheets([...allSheets, name]);
    setCurrentSheet(name);
    setCachedData(prev => ({ ...prev, [name]: [] })); // Initialize empty cache for new tab
    setNewTabName("");
    setShowAddTabModal(false);

    // Save in background (no waiting)
    createSheet(name).then(res => {
      if (!res.success) {
        // Rollback on error
        setAllSheets(prevSheets);
        setCurrentSheet(prevSheets[0]);
        toast.error("فشل في إنشاء التصنيف");
      }
    }).catch(() => {
      setAllSheets(prevSheets);
      setCurrentSheet(prevSheets[0]);
    });
  };

  const handleDeleteTab = async (sheetName: string) => {
    // Prevent deleting the last remaining tab
    if (allSheets.length <= 1) {
      toast.error("لا يمكن حذف آخر تصنيف");
      return;
    }

    const previousSheets = [...allSheets];
    const filtered = allSheets.filter(s => s !== sheetName);
    setAllSheets(filtered);
    if (currentSheet === sheetName) setCurrentSheet(filtered[0]);

    try {
      const res = await deleteSheet(sheetName);
      if (!res.success) setAllSheets(previousSheets);
    } catch (error) {
      setAllSheets(previousSheets);
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    const prevTransactions = [...transactions];
    const filtered = transactions.filter(t => t.id !== id);
    setTransactions(filtered);
    setCachedData(prev => ({ ...prev, [currentSheet]: filtered }));

    try {
      const { deleteTransaction } = await import("@/app/actions");
      const res = await deleteTransaction(currentSheet, id);
      if (!res.success) {
        setTransactions(prevTransactions);
        setCachedData(prev => ({ ...prev, [currentSheet]: prevTransactions }));
      }
    } catch (e) {
      setTransactions(prevTransactions);
      setCachedData(prev => ({ ...prev, [currentSheet]: prevTransactions }));
    }
  }

  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" suppressHydrationWarning>

      {/* ================= HEADER ================= */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-5 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            {/* Avatar - Clickable for Navigation */}
            <button 
              onClick={() => setIsNavOpen(true)}
              className="relative group transition-transform active:scale-95 outline-none"
            >
              {(() => {
                if (username === "جاري التحميل...") {
                  return <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse shrink-0" />;
                }

                if (username.includes("ادم")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                        <img src="/adam.jpg" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   );
                }

                if (username.includes("نسرين")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                        <img src="/nesreen.jpg" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   );
                }

                if (username.includes("نور")) {
                   return (
                     <div className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-lg shadow-gray-200 shrink-0 overflow-hidden bg-white">
                        <img src="/noor.webp" alt="Avatar" className="w-full h-full object-cover" />
                     </div>
                   );
                }
                
                // Fallback to Gradient Letter for others (until photos are added)
                return (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-gray-200 shrink-0">
                    {username.slice(0, 1)}
                  </div>
                );
              })()}
              
              {/* Menu Indicator Badge */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                <div className="w-1 h-1 bg-gray-400 rounded-full box-content border-[1.5px] border-white" />
                <div className="w-1 h-1 bg-gray-400 rounded-full box-content border-[1.5px] border-white ml-[1px]" />
              </div>
            </button>

            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {username !== "جاري التحميل..." ? username.split(" ")[0] : "..."} 👋
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold text-gray-400">{currentSheet}</p>
                <div className="w-1 h-1 rounded-full bg-emerald-400 mr-[-5px] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          </div>

          <div className="text-center bg-emerald-50/50 px-4 py-2 rounded-2xl border border-emerald-100/50 backdrop-blur-sm">
            <div className="text-[10px] text-emerald-600 font-black mb-0.5 uppercase tracking-wider opacity-80">إجمالي المبلغ</div>
            <div className="text-xl font-black text-emerald-600 leading-none tracking-tight">
              {total.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-4 pb-24 space-y-6 text-right">
        {/* ================= ACTIONS & DATA SECTION ================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-center gap-2 px-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                viewMode === 'list'
                  ? "bg-primary text-white shadow-primary/30"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
              title="الرئيسية"
            >
              <Home className="w-4 h-4" />
            </button>
              <button
                 onClick={() => setViewMode(prev => prev === 'stats' ? 'list' : 'stats')}
                 className={cn(
                   "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                   viewMode === 'stats' 
                     ? "bg-emerald-500 text-white shadow-emerald-200" 
                     : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                 )}
                 title="الإحصائيات"
               >
                 <PieChartIcon className="w-4 h-4" />
               </button>

              <button
                 onClick={() => setViewMode(prev => prev === 'settings' ? 'list' : 'settings')}
                 className={cn(
                   "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                   viewMode === 'settings' 
                     ? "bg-amber-500 text-white shadow-amber-200" 
                     : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                 )}
                 title="الإعدادات"
               >
                 <Settings className="w-4 h-4" />
               </button>



          </div>

          {viewMode === 'stats' ? (
            <StatisticsView 
              transactions={transactions}
              currentSheet={currentSheet}
              goal={goals[currentSheet] || 0}
              loadingGoal={goalsLoading[currentSheet]}
              onGoalChange={() => {}} // View only - no changes
              onBack={() => setViewMode('list')}
              unitGoal={unitGoals[currentSheet] || { enabled: false, unitName: '', unitPrice: 0, unitTarget: 0 }}
              onUnitGoalChange={() => {}} // View only - no changes
            />
          ) : viewMode === 'settings' ? (
            <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500" />
                  الإعدادات
                </h2>
              </div>

              {/* Goals Card */}
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <h3 className="font-black text-gray-800">أهداف التبرع</h3>
                </div>

                {/* 4 Inputs Grid */}
                <div className="grid grid-cols-2 gap-5">
                  {/* Financial Goal */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                      الهدف المالي
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(goals[currentSheet] || 0) === 0 ? "" : (goals[currentSheet] || 0).toLocaleString()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const newGoal = parseFloat(raw) || 0;
                            setGoals(prev => ({ ...prev, [currentSheet]: newGoal }));
                            // Debounced server call
                            if (goalDebounce.current) clearTimeout(goalDebounce.current);
                            goalDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateCategoryGoal }) => {
                                updateCategoryGoal(currentSheet, newGoal);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="90,000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Target */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-rose-500" />
                      هدف الوحدة
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors pointer-events-none">
                         <Target className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(unitGoals[currentSheet]?.unitTarget || 0) === 0 ? '' : unitGoals[currentSheet]?.unitTarget}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                            const newVal = parseInt(raw) || 0;
                            const isEnabled = newVal > 0 || current.unitName.trim() !== '' || current.unitPrice > 0;
                            const updated = { ...current, unitTarget: newVal, enabled: isEnabled };
                            setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                            // Debounced server call
                            if (unitTargetDebounce.current) clearTimeout(unitTargetDebounce.current);
                            unitTargetDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateUnitGoal }) => {
                                updateUnitGoal(currentSheet, updated);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="50"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      اسم الوحدة
                    </label>
                    <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                        <Package className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={unitGoals[currentSheet]?.unitName || ''}
                        onChange={(e) => {
                          const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                          const newVal = e.target.value;
                          const isEnabled = newVal.trim() !== '' || current.unitPrice > 0 || current.unitTarget > 0;
                          const updated = { ...current, unitName: newVal, enabled: isEnabled };
                          setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                          // Debounced server call
                          if (unitNameDebounce.current) clearTimeout(unitNameDebounce.current);
                          unitNameDebounce.current = setTimeout(() => {
                            import("@/app/actions").then(({ updateUnitGoal }) => {
                              updateUnitGoal(currentSheet, updated);
                            });
                          }, 1000);
                        }}
                        placeholder="شنطة"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  {/* Unit Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-blue-500" />
                      سعر الوحدة
                    </label>
                    <div className="relative group">
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <Coins className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(unitGoals[currentSheet]?.unitPrice || 0) === 0 ? '' : unitGoals[currentSheet]?.unitPrice}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(raw)) {
                            const current = unitGoals[currentSheet] || { enabled: true, unitName: '', unitPrice: 0, unitTarget: 0 };
                            const newVal = parseFloat(raw) || 0;
                            const isEnabled = newVal > 0 || current.unitName.trim() !== '' || current.unitTarget > 0;
                            const updated = { ...current, unitPrice: newVal, enabled: isEnabled };
                            setUnitGoals(prev => ({ ...prev, [currentSheet]: updated }));
                            // Debounced server call
                            if (unitPriceDebounce.current) clearTimeout(unitPriceDebounce.current);
                            unitPriceDebounce.current = setTimeout(() => {
                              import("@/app/actions").then(({ updateUnitGoal }) => {
                                updateUnitGoal(currentSheet, updated);
                              });
                            }, 1000);
                          }
                        }}
                        placeholder="250"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 font-bold text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management Card */}
              <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-black text-gray-800">إدارة البيانات</h3>
                </div>

                <div className="space-y-3">
                  {/* Export Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 p-4 rounded-xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Download className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">تصدير البيانات (CSV)</div>
                            <div className="text-[10px] text-indigo-400 font-semibold">تحميل نسخة من العمليات</div>
                          </div>
                        </div>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="text-right rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">تصدير البيانات؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          هل تريد تحميل كافة العمليات في ملف CSV؟
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => {
                          try {
                            // Calculate Summaries
                            const totalIn = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                            const totalOut = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                            const netTotal = totalIn - totalOut;

                            let csvContent = "\uFEFF";
                            
                            // Section 1: Meta Info
                            csvContent += `Transactions Report\n`;
                            csvContent += `Sheet Name,${currentSheet}\n`;
                            csvContent += `User Name,${username !== "جاري التحميل..." ? username : ""}\n`;
                            csvContent += `Export Date,${new Date().toLocaleDateString('en-US')}\n`;
                            csvContent += `\n`; // Spacer

                            // Section 2: Dashboard Summary
                            csvContent += `Dashboard Summary\n`;
                            csvContent += `Total In,${totalIn}\n`;
                            csvContent += `Total Out,${totalOut}\n`;
                            csvContent += `Net Total,${netTotal}\n`;
                            csvContent += `\n`; // Spacer

                            // Section 3: Details
                            csvContent += `Transaction Details\n`;
                            csvContent += `Date,Name,Type,Amount,Note\n`;

                            transactions.forEach(row => {
                              const type = row.amount >= 0 ? "Income" : "Expense";
                              const absAmount = Math.abs(row.amount);
                              // Escape quotes in note
                              const safeNote = (row.note || "").replace(/"/g, '""');
                              
                              csvContent += `${row.date},${row.name},${type},${absAmount},"${safeNote}"\n`;
                            });

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = `Report_${currentSheet}_${new Date().toISOString().split('T')[0]}.csv`;
                            link.click();
                          } catch (e) {
                            console.error(e);
                            toast.error("Export Failed");
                          }
                        }} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">تصدير الآن</AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 p-4 rounded-xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">مسح كافة البيانات</div>
                            <div className="text-[10px] text-red-400 font-semibold">حذف نهائي لجميع العمليات</div>
                          </div>
                        </div>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="text-right rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          سيتم حذف كافة العمليات في "{currentSheet}". لا يمكن التراجع.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-xl font-bold" onClick={() => {
                          const prevTransactions = [...transactions];
                          // Optimistic: clear immediately
                          setTransactions([]);
                          setCachedData(prev => ({ ...prev, [currentSheet]: [] }));
                          // Fire-and-forget: server clears in background
                          clearAllTransactions(currentSheet).then(res => {
                            if (!res?.success) {
                              setTransactions(prevTransactions);
                              setCachedData(prev => ({ ...prev, [currentSheet]: prevTransactions }));
                            }
                          }).catch(() => {
                            setTransactions(prevTransactions);
                            setCachedData(prev => ({ ...prev, [currentSheet]: prevTransactions }));
                          });
                        }}>نعم، امسح الكل</AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-black text-xs uppercase tracking-widest text-gray-400">جاري التحميل...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TransactionList
                transactions={transactions}
                sheetName={currentSheet}
                onDelete={handleDeleteTransaction}
                onUpdate={(newList) => {
                  setTransactions(newList);
                  setCachedData(prev => ({ ...prev, [currentSheet]: newList }));
                }}
                onAddSuccess={() => {
                  getTransactions(currentSheet).then(data => {
                    setTransactions(data);
                    setCachedData(prev => ({ ...prev, [currentSheet]: data }));
                  });
                }}
              />
            </div>
          )}
          
          {/* Logout Button Removed - Moved to NavigationHub */}

        </section>
      </main>

      <NavigationHub
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentView={viewMode}
        onViewChange={setViewMode}
        username={username}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        sheets={allSheets}
        currentSheet={currentSheet}
        onSheetChange={setCurrentSheet}
        onRename={async (oldName, newName) => {
             // Wrapper to handle rename from Hub
             if (!newName.trim() || newName === oldName) return;
             
             const prevSheets = [...allSheets];
             const newSheets = allSheets.map(s => s === oldName ? newName : s);
             setAllSheets(newSheets);
             if (currentSheet === oldName) setCurrentSheet(newName);

             try {
               const res = await renameSheet(oldName, newName);
               if (!res.success) {
                  toast.error("فشل في تغيير الاسم");
                  setAllSheets(prevSheets);
                  if (currentSheet === newName) setCurrentSheet(oldName);
               }
             } catch (e) {
                setAllSheets(prevSheets);
                if (currentSheet === newName) setCurrentSheet(oldName);
             }
        }}
        onDelete={handleDeleteTab}
        onAdd={(name) => {
           if (!name.trim()) return;
           const newName = name.trim();
           
           // Optimistic UI
           const prevSheets = [...allSheets];
           setAllSheets([...allSheets, newName]);
           setCurrentSheet(newName);
           setCachedData(prev => ({ ...prev, [newName]: [] }));

           createSheet(newName).then(res => {
             if (!res.success) {
               setAllSheets(prevSheets);
               setCurrentSheet(prevSheets[0]);
               toast.error("فشل في إنشاء التصنيف");
             }
           }).catch(() => {
             setAllSheets(prevSheets);
             setCurrentSheet(prevSheets[0]);
           });
        }}
      />
    </div>
  );
}
