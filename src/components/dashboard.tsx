"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect, useRef } from "react";
import { Home, Plus, Download, Trash2, Loader2, Coins, User, StickyNote, X, Pencil, Check, LogOut, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatisticsView } from "./statistics-view";
import { TransactionList } from "./transaction-list";
import { supabase } from "@/lib/supabase";
import { clearAllTransactions, getTransactions, createSheet, deleteSheet, logoutUser, getUserProfile, renameSheet } from "@/app/actions";
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
  initialSheets,
  initialTransactions
}: {
  initialSheets: string[],
  initialTransactions: any[]
}) {
  const [currentSheet, setCurrentSheet] = useState(initialSheets[0] || "Donation");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const [loading, setLoading] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [allSheets, setAllSheets] = useState(initialSheets);
  const [mounted, setMounted] = useState(false);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [goalsLoading, setGoalsLoading] = useState<Record<string, boolean>>({});
  const longPressTimer = useRef<NodeJS.Timeout>(null);

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
  useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side Cache
  const [cachedData, setCachedData] = useState<Record<string, any[]>>({
    [initialSheets[0] || "Donation"]: initialTransactions
  });

  // Refresh data when currentSheet changes
  const [username, setUsername] = useState("جاري التحميل...");
  useEffect(() => {
    getUserProfile().then(p => {
      setUsername(p?.displayName || p?.username || "Unknown");
    });
  }, []);

  const router = useRouter();
  const handleLogout = async () => {
    setLoading(true);
    await logoutUser();
    router.push("/login");
  };

  useEffect(() => {
    if (cachedData[currentSheet]) {
      setTransactions(cachedData[currentSheet]);
    }

    const fetchTransactions = async () => {
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSheet]);

  const handleCreateTab = async () => {
    if (!newTabName.trim()) return;
    setIsCreatingTab(true);

    const prevSheets = [...allSheets];
    const name = newTabName.trim();
    setAllSheets([...allSheets, name]);
    setCurrentSheet(name);
    setNewTabName("");
    setShowAddTabModal(false);

    try {
      const res = await createSheet(name);
      if (!res.success) {
        setAllSheets(prevSheets);
        setCurrentSheet(prevSheets[0]);
      }
    } catch (error) {
      setAllSheets(prevSheets);
      setCurrentSheet(prevSheets[0]);
    } finally {
      setIsCreatingTab(false);
    }
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
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-5 sticky top-0 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            
            {/* Avatar */}
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-gray-200 shrink-0 transform hover:scale-105 transition-transform duration-300">
                  {username.slice(0, 1)}
                </div>
              );
            })()}

            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                مرحباً، {username !== "جاري التحميل..." ? username.split(" ")[0] : "..."} 👋
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold text-gray-400">إدارة التبرعـات</p>
                <div className="w-1 h-1 rounded-full bg-emerald-400 mr-[-5px] animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          </div>

          <div className="text-center bg-emerald-50/50 px-4 py-2 rounded-2xl border border-emerald-100/50 backdrop-blur-sm">
            <div className="text-[10px] text-emerald-600 font-black mb-0.5 uppercase tracking-wider opacity-80">إجمالي المبلغ</div>
            <div className="text-xl font-black text-emerald-600 leading-none tracking-tight">
              {total.toLocaleString()}
              <span className="text-[10px] mr-1 opacity-70">ج.م</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-4 pb-24 space-y-6 text-right">
        {/* ================= ACTIONS & DATA SECTION ================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setViewMode('list')}
              title="العودة للسجل"
            >
              <div className="p-2 bg-primary/5 rounded-lg">
                <Coins className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">سجل العمليات</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                 onClick={() => setViewMode(prev => prev === 'list' ? 'stats' : 'list')}
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm"
                    title="تصدير CSV"
                  >
                    <Download className="w-4 h-4" />
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm" title="حذف الكل">
                    <Trash2 className="w-4 h-4" />
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
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-xl font-bold" onClick={async () => {
                      const prevTransactions = [...transactions];
                      setTransactions([]);
                      setCachedData(prev => ({ ...prev, [currentSheet]: [] }));
                      try {
                        const res = await clearAllTransactions(currentSheet);
                        if (!res?.success) setTransactions(prevTransactions);
                      } catch (e) { setTransactions(prevTransactions); }
                    }}>نعم، امسح الكل</AlertDialogAction>
                    <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {viewMode === 'stats' ? (
            <StatisticsView 
              transactions={transactions}
              currentSheet={currentSheet}
              goal={goals[currentSheet] || 0}
              loadingGoal={goalsLoading[currentSheet]}
              onGoalChange={(newGoal) => {
                setGoals(prev => ({ ...prev, [currentSheet]: newGoal }));
                import("@/app/actions").then(({ updateCategoryGoal }) => {
                  updateCategoryGoal(currentSheet, newGoal);
                });
              }}
              onBack={() => setViewMode('list')}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-black text-xs uppercase tracking-widest text-gray-400">جاري التحميل...</p>
            </div>
          ) : (
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
          )}
          
          {/* Logout Button at Bottom */}
          <div className="pt-8 pb-4">
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all"
            >
              <LogOut className="w-5 h-5 stroke-[2.5px]" />
              تسجيل الخروج
            </button>
          </div>
        </section>
      </main>

      {/* ================= BOTTOM NAVIGATION ================= */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-xl mx-auto px-4 py-2 flex items-center gap-2.5 min-h-[56px]">
          {/* Add Tab Button */}
          <div className="shrink-0">
            <Dialog open={showAddTabModal} onOpenChange={setShowAddTabModal}>
              <DialogTrigger asChild>
                <button
                  className="w-9 h-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all active:scale-90 border border-gray-100"
                  title="إضافة تصنيف"
                >
                  <Plus className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </DialogTrigger>
              <DialogContent className="text-right sm:max-w-[425px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
                <div className="absolute top-4 left-4 z-50">
                  <DialogClose className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full flex items-center justify-center transition-all">
                    <X className="w-4 h-4" />
                  </DialogClose>
                </div>

                <div className="p-6 pt-10 space-y-6">
                  <DialogHeader className="text-right pr-2 border-r-4 border-primary">
                    <DialogTitle className="text-xl font-black text-gray-900">تصنيف جديد</DialogTitle>
                    <p className="text-xs text-gray-400 font-bold">أضف اسماً للمجلد الجديد لتنظيم عملياتك</p>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="مثلاً: صدقة جارية، زكاة..."
                        autoFocus
                        value={newTabName}
                        onChange={(e) => setNewTabName(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-right font-black text-gray-700 placeholder:text-gray-300 focus:border-primary/30 focus:bg-white outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTab()}
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex-row-reverse gap-3 pt-2">
                    <button
                      onClick={handleCreateTab}
                      disabled={isCreatingTab || !newTabName.trim()}
                      className="flex-1 py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                    >
                      {isCreatingTab ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[3px]" />}
                      تأكيد الإنشاء
                    </button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="h-5 w-[1px] bg-gray-200 shrink-0 mx-0.5" />

          {/* Tabs List */}
          <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar py-3 px-1">
            {allSheets.map((sheet) => (
              <div key={sheet} className="relative shrink-0 flex items-center group">
                {editingTab === sheet ? (
                  <div className="relative">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleRenameTab}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameTab()}
                      style={{ width: `${Math.max(renameValue.length, 6) + 4}ch` }}
                      className="h-9 px-3 rounded-xl font-bold text-[13px] text-center border-2 border-primary outline-none min-w-[100px]"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentSheet(sheet)}
                      onDoubleClick={() => {
                        setEditingTab(sheet);
                        setRenameValue(sheet);
                      }}
                      // Long Press for Mobile
                      onTouchStart={(e) => {
                        longPressTimer.current = setTimeout(() => {
                          setEditingTab(sheet);
                          setRenameValue(sheet);
                          try {
                            if (navigator.vibrate) navigator.vibrate(50);
                          } catch (e) { /* ignore */ }
                        }, 600);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      onTouchMove={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      className={cn(
                        "h-9 px-5 rounded-xl font-black text-[13px] transition-all whitespace-nowrap flex items-center justify-center relative select-none",
                        currentSheet === sheet
                          ? "bg-primary text-white -translate-y-[1px]"
                          : "bg-white text-gray-400 border border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {sheet}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTab(sheet);
                        setRenameValue(sheet);
                      }}
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all z-10",
                        "opacity-0 group-hover:opacity-100 scale-90 hover:scale-110 bg-blue-500 text-white"
                      )}
                      title="تعديل الاسم"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                  </>
                )}

                {allSheets.length > 1 && !editingTab && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className={cn(
                        "absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all z-10",
                        "opacity-100 sm:opacity-0 group-hover:opacity-100 scale-100 active:scale-90",
                        currentSheet === sheet ? "bg-red-500 text-white" : "bg-gray-400 text-white"
                      )}>
                        <X className="w-2.5 h-2.5 stroke-[4px]" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="text-right rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">حذف التصنيف؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                          سيتم حذف "{sheet}" بالكامل مع جميع بياناته.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => handleDeleteTab(sheet)} className="bg-red-600 rounded-xl font-bold">نعم، احذف</AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
            <div className="w-4 shrink-0" />
          </div>
        </div>
      </nav>
    </div>
  );
}
