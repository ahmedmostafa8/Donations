"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X, Loader2, Plus } from "lucide-react";
import { updateTransaction, addTransaction } from "@/app/actions";
import { cn } from "@/lib/utils";
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

interface Transaction {
  id: number;
  date: string;
  name: string;
  amount: number;
  note: string;
}

export function TransactionList({ 
    transactions,
    sheetName,
    onDelete,
    onUpdate,
    onAddSuccess
}: { 
    transactions: Transaction[],
    sheetName: string,
    onDelete?: (id: number) => void,
    onUpdate?: (newList: Transaction[]) => void,
    onAddSuccess?: () => void
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({ name: "", amount: "", note: "" });

  const handleStartEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditData({ ...t });
    setIsAdding(false);
  };

  const handleSaveEdit = async () => {
    if (!editData || !sheetName) return;
    setIsBusy(true);
    
    const originalTransactions = [...transactions];
    const updatedTransactions = transactions.map(t => 
        t.id === editingId ? { ...t, ...editData, amount: parseFloat(editData.amount) || 0 } : t
    );
    if (onUpdate) onUpdate(updatedTransactions as any);

    try {
        const res = await updateTransaction(sheetName, editingId!, {
            name: editData.name,
            amount: editData.amount.toString(),
            note: editData.note || ""
        });
        if (res.success) {
            setEditingId(null);
        } else {
            if (onUpdate) onUpdate(originalTransactions);
        }
    } catch (e) {
        if (onUpdate) onUpdate(originalTransactions);
    } finally {
        setIsBusy(false);
    }
  };

  const handleSaveAdd = async () => {
    if (!newData.name || !newData.amount || !sheetName) return;
    setIsBusy(true);

    const formData = new FormData();
    formData.append("name", newData.name);
    formData.append("amount", newData.amount);
    formData.append("note", newData.note);

    try {
        const res = await addTransaction(formData, sheetName);
        if (res.success) {
            setNewData({ name: "", amount: "", note: "" });
            setIsAdding(false);
            if (onAddSuccess) onAddSuccess();
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsBusy(false);
    }
  };

  const handleInternalDelete = async (id: number) => {
    setDeletingId(id);
    if (onDelete) await onDelete(id);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-2 relative">
      
      {/* ================= ADD NEW FORM ================= */}
      {!isAdding ? (
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98] bg-white text-[13px] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عملية جديدة</span>
          </button>
      ) : (
          <div className="card-simple flex flex-col gap-2 border-primary/30 ring-4 ring-primary/5 py-3 px-3">
              <div className="flex items-center gap-2">
                  {/* RIGHT Side (First in RTL): Data Inputs */}
                  <div className="flex-1 flex flex-col gap-1.5">
                     <input 
                        className="input-simple text-[14px] h-9 px-3 font-bold border-primary/20 focus:border-primary w-full text-right" 
                        value={newData.name} 
                        autoFocus
                        onChange={e => setNewData({...newData, name: e.target.value})}
                        placeholder="الاسم"
                     />
                     <input 
                        className="input-simple text-[13px] h-9 px-3 font-bold border-primary/20 focus:border-primary w-full text-right" 
                        value={newData.note} 
                        onChange={e => setNewData({...newData, note: e.target.value})}
                        placeholder="ملاحظة"
                     />
                  </div>

                  {/* LEFT Side (Last in RTL): Price and Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                     <input 
                        type="number"
                        inputMode="decimal"
                        className="input-simple text-[13px] h-9 w-20 px-2 font-black border-primary/20 focus:border-primary text-center bg-primary/5 rounded-lg placeholder:font-normal" 
                        value={newData.amount} 
                        onChange={e => setNewData({...newData, amount: e.target.value})}
                        placeholder="المبلغ"
                     />
                     <div className="w-px h-8 bg-gray-100 mx-0.5" />
                     <div className="flex flex-col gap-1 shrink-0">
                        <button 
                            onClick={handleSaveAdd}
                            disabled={isBusy}
                            className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-md"
                        >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4.5 h-4.5 stroke-[2.5px]" />}
                        </button>
                        <button 
                            onClick={() => setIsAdding(false)}
                            className="w-8 h-8 bg-white border border-gray-100 text-gray-400 rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-sm"
                        >
                            <X className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </button>
                     </div>
                  </div>
              </div>
          </div>
      )}

      {transactions.length === 0 && !isAdding && (
        <div className="text-center py-20 text-gray-300 font-bold">لا توجد عمليات حالياً</div>
      )}

      {/* ================= LIST ROWS ================= */}
      {transactions.map((t) => (
        <div key={t.id} className={cn(
            "card-simple py-2 px-3 group transition-all",
            editingId === t.id && "border-blue-200 ring-4 ring-blue-50"
        )}>
          {editingId === t.id ? (
              <div className="flex items-center gap-2">
                  {/* RIGHT Side (First in RTL): Data Inputs */}
                  <div className="flex-1 flex flex-col gap-1.5">
                      <input 
                        className="input-simple text-[14px] h-9 px-3 font-bold w-full text-right" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                      />
                      <input 
                        className="input-simple text-[13px] h-9 px-3 font-bold w-full text-right" 
                        value={editData.note || ""} 
                        onChange={e => setEditData({...editData, note: e.target.value})}
                        placeholder="ملاحظة"
                      />
                  </div>

                  {/* LEFT Side (Last in RTL): Price and Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                      <input 
                        type="number"
                        inputMode="decimal"
                        className="input-simple text-[13px] h-9 w-20 px-2 font-black border-blue-200 text-center bg-blue-50/50 rounded-lg" 
                        value={editData.amount} 
                        onChange={e => setEditData({...editData, amount: e.target.value})}
                      />
                      <div className="w-px h-8 bg-gray-100 mx-0.5" />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button 
                            onClick={handleSaveEdit}
                            disabled={isBusy}
                            className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center active:scale-95 transition-all shadow-md"
                        >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4.5 h-4.5 stroke-[3px]" />}
                        </button>
                        <button 
                            onClick={() => setEditingId(null)}
                            className="w-8 h-8 bg-white border border-gray-100 text-gray-400 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                        >
                            <X className="w-4.5 h-4.5 stroke-[3px]" />
                        </button>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="flex items-center justify-between gap-3">
                  {/* RIGHT Side (First in RTL): Name and Note (Expanded) */}
                  <div className="flex-1 flex flex-col gap-0 text-right min-w-0 justify-center">
                      <div className="font-bold text-gray-900 text-[15px] leading-tight truncate">{t.name}</div>
                      {t.note && (
                          <div className="text-[11px] text-gray-400 font-bold truncate">
                             {t.note}
                          </div>
                      )}
                  </div>

                  {/* LEFT Side (Last in RTL): Price and Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                       <div className="shrink-0 flex items-center px-2.5 h-8.5 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="text-[15px] font-black text-primary leading-none flex items-baseline">
                             {t.amount.toLocaleString()}
                             <span className="text-[8px] mr-1 font-bold">ج.م</span>
                          </div>
                       </div>
                       
                       <div className="w-px h-6 bg-gray-100 mx-0.5" />

                       <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                              onClick={() => handleStartEdit(t)}
                              className="w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-all active:scale-90"
                              title="تعديل"
                          >
                              <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <button 
                                   className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all active:scale-90"
                                   title="حذف"
                               >
                                   {deletingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                               </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="text-right">
                               <AlertDialogHeader>
                                   <AlertDialogTitle>حذف العملية؟</AlertDialogTitle>
                                   <AlertDialogDescription>
                                       هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع.
                                   </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter className="flex-row-reverse gap-2">
                                   <AlertDialogAction onClick={() => handleInternalDelete(t.id)} className="bg-red-600 hover:bg-red-700">نعم، احذف</AlertDialogAction>
                                   <AlertDialogCancel>إلغاء</AlertDialogCancel>
                               </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       </div>
                  </div>
              </div>
          )}
        </div>
      ))}
    </div>
  );
}
