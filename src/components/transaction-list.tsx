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
    const [transactionType, setTransactionType] = useState<"add" | "deduct">("add");

    const handleStartEdit = (t: Transaction) => {
        setEditingId(t.id);
        setEditData({ ...t });
        setIsAdding(false);
    };

    const handleSaveEdit = () => {
        if (!editData || !sheetName) return;

        const originalTransactions = [...transactions];
        const updatedTransactions = transactions.map(t =>
            t.id === editingId ? { ...t, ...editData, amount: parseFloat(editData.amount) || 0 } : t
        );
        
        // Optimistic UI: update immediately and close edit mode
        if (onUpdate) onUpdate(updatedTransactions as any);
        const savedEditingId = editingId;
        setEditingId(null);

        // Save in background (no waiting)
        updateTransaction(sheetName, savedEditingId!, {
            name: editData.name,
            amount: editData.amount.toString(),
            note: editData.note || ""
        }).then(res => {
            if (!res.success && onUpdate) {
                // Rollback on error
                onUpdate(originalTransactions);
            }
        }).catch(() => {
            if (onUpdate) onUpdate(originalTransactions);
        });
    };

    const handleSaveAdd = async () => {
        if (!newData.name || !newData.amount || !sheetName) return;
        
        // Handle negative amount if 'deduct' is selected
        const amountValue = Math.abs(parseFloat(newData.amount) || 0);
        const finalAmount = transactionType === "deduct" ? -amountValue : amountValue;

        // Create optimistic transaction (appears instantly)
        const optimisticTransaction: Transaction = {
            id: Date.now(), // Temporary ID
            date: new Date().toLocaleString('ar-EG', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }),
            name: newData.name,
            amount: finalAmount,
            note: newData.note
        };

        // Immediately add to UI (optimistic update)
        if (onUpdate) {
            onUpdate([optimisticTransaction, ...transactions]);
        }

        // Reset form immediately for snappy UX
        setNewData({ name: "", amount: "", note: "" });
        setTransactionType("add");
        setIsAdding(false);

        // Save in background (no waiting)
        const formData = new FormData();
        formData.append("name", optimisticTransaction.name);
        formData.append("amount", finalAmount.toString());
        formData.append("note", optimisticTransaction.note);

        try {
            const res = await addTransaction(formData, sheetName);
            if (res.success && onAddSuccess) {
                // Sync with server to get real ID
                onAddSuccess();
            }
        } catch (e) {
            console.error(e);
            // Rollback on error (remove optimistic item)
            if (onUpdate) {
                onUpdate(transactions.filter(t => t.id !== optimisticTransaction.id));
            }
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
                                onChange={e => setNewData({ ...newData, name: e.target.value })}
                                placeholder="الاسم"
                            />
                            <input
                                className="input-simple text-[13px] h-9 px-3 font-bold border-primary/20 focus:border-primary w-full text-right"
                                value={newData.note}
                                onChange={e => setNewData({ ...newData, note: e.target.value })}
                                placeholder="ملاحظة"
                            />
                        </div>

                        {/* LEFT Side (Last in RTL): Price and Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex flex-col gap-1">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    className={cn(
                                        "input-simple text-[13px] h-9 w-24 px-2 font-black border-primary/20 focus:border-primary text-center rounded-lg placeholder:font-normal transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                        transactionType === "deduct" ? "bg-red-50 text-red-600 focus:border-red-500" : "bg-primary/5 text-gray-900"
                                    )}
                                    value={newData.amount}
                                    onChange={e => setNewData({ ...newData, amount: e.target.value })}
                                    placeholder="المبلغ"
                                />
                                <div className="flex flex-col gap-1 w-24">
                                    <button
                                        onClick={() => setTransactionType("add")}
                                        className={cn(
                                            "h-6 rounded-md text-[10px] font-black transition-all border",
                                            transactionType === "add"
                                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                                : "bg-white text-gray-400 border-gray-200 hover:border-emerald-200 hover:text-emerald-500"
                                        )}
                                    >
                                        بإضافة
                                    </button>
                                    <button
                                        onClick={() => setTransactionType("deduct")}
                                        className={cn(
                                            "h-6 rounded-md text-[10px] font-black transition-all border",
                                            transactionType === "deduct"
                                                ? "bg-red-500 text-white border-red-500 shadow-sm"
                                                : "bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-500"
                                        )}
                                    >
                                        بخصم
                                    </button>
                                </div>
                            </div>
                            <div className="w-px h-14 bg-gray-100 mx-0.5" />
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
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                                <input
                                    className="input-simple text-[13px] h-9 px-3 font-bold w-full text-right"
                                    value={editData.note || ""}
                                    onChange={e => setEditData({ ...editData, note: e.target.value })}
                                    placeholder="ملاحظة"
                                />
                            </div>

                            {/* LEFT Side (Last in RTL): Price and Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    className="input-simple text-[13px] h-9 w-20 px-2 font-black border-blue-200 text-center bg-blue-50/50 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={editData.amount}
                                    onChange={e => setEditData({ ...editData, amount: e.target.value })}
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
                                <div className={cn(
                                    "shrink-0 flex items-center px-2.5 h-8.5 rounded-lg border",
                                    t.amount < 0
                                        ? "bg-red-50 border-red-100"
                                        : "bg-emerald-50 border-emerald-100"
                                )}>
                                    <div className={cn(
                                        "text-[15px] font-black leading-none flex items-baseline",
                                        t.amount < 0 ? "text-red-600" : "text-emerald-600"
                                    )}>
                                        {Math.abs(t.amount).toLocaleString()}
                                        <span className="text-[8px] mr-1 font-bold">ج.م</span>
                                    </div>
                                </div>

                                <div className="w-px h-6 bg-gray-100 mx-0.5" />

                                <div className="flex items-center gap-1.5">
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
                                        <AlertDialogContent className="max-w-md w-full rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl focus:outline-none">
                                            <div className="p-8 flex flex-col items-center text-center gap-4 bg-white">
                                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
                                                    <Trash2 className="w-8 h-8 text-red-500 stroke-[1.5]" />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-black text-gray-900 text-center">
                                                            حذف العملية؟
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-center text-gray-500 font-medium px-4">
                                                            هل أنت متأكد من حذف هذه العملية؟ <br/>
                                                            <span className="text-red-500 font-bold block mt-1">لا يمكن التراجع عن هذا الإجراء.</span>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                </div>

                                                <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse sm:space-x-2 w-full gap-2 mt-4">
                                                    <AlertDialogAction 
                                                        onClick={() => handleInternalDelete(t.id)} 
                                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200 focus:outline-none focus:ring-0 transition-all"
                                                    >
                                                        نعم، احذف
                                                    </AlertDialogAction>
                                                    <AlertDialogCancel className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-xl h-12 font-bold focus:outline-none focus:ring-0 transition-all">
                                                        تراجع
                                                    </AlertDialogCancel>
                                                </AlertDialogFooter>
                                            </div>
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
