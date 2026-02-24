"use client";

import { useRef, useEffect, useState } from "react";
import { 
  LogOut, 
  Grid3X3, 
  X, 
  FolderOpen,
  Check,
  Users,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback } from "react";

interface NavigationHubProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'list' | 'stats' | 'settings';
  onViewChange: (view: 'list' | 'stats' | 'settings') => void;
  username: string;
  onLogout: () => void;
  onGoHome: () => void;
  sheets: string[];
  currentSheet: string;
  onSheetChange: (sheet: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (sheetName: string) => void;
  onAdd: (name: string) => void;
}

export function NavigationHub({ 
  isOpen, 
  onClose, 
  username, 
  onLogout, 
  sheets,
  currentSheet,
  onSheetChange,
  onViewChange,
  onRename,
  onDelete,
  onAdd
}: NavigationHubProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [editingSheet, setEditingSheet] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTabValue, setNewTabValue] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ... (useEffect/handlers same as before)
  
  // Handlers for Add
  const saveNewTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTabValue.trim()) {
      onAdd(newTabValue.trim());
      setIsCreating(false);
      setNewTabValue("");
    }
  };

  const cancelNewTab = () => {
    setIsCreating(false);
    setNewTabValue("");
  };

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
      setEditingSheet(null);
      setOpenMenu(null);
    }, 300);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleSwitchToFamilies = () => {
    window.location.href = "/families";
  };

  const startEditing = (sheet: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSheet(sheet);
    setEditValue(sheet);
    setOpenMenu(null);
  };

  const saveEdit = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingSheet && editValue.trim() && editValue !== editingSheet) {
      onRename(editingSheet, editValue.trim());
    }
    setEditingSheet(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSheet(null);
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // ... (useEffect/handlers)

  const requestDelete = (sheet: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation(sheet);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDelete(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  if (!isOpen && !closing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 isolate" dir="rtl">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-md transition-opacity duration-300",
          isOpen && !closing ? "opacity-100" : "opacity-0"
        )} 
        onClick={handleClose}
      />

      {/* Content Container */}
      <div 
        ref={menuRef}
        className={cn(
          "relative w-full max-w-sm bg-[#0a0a0f] border border-white/10 rounded-[32px] shadow-2xl transition-all duration-300 transform overflow-hidden flex flex-col max-h-[85vh]",
          isOpen && !closing ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"
        )}
      >
        {/* Warm Ambient Background Effects */}
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-amber-600/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-violet-600/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />

        {/* Delete Confirmation Overlay */}
        {deleteConfirmation && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 ring-1 ring-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">حذف الدفتر؟</h3>
            <p className="text-gray-400 text-sm mb-8">
              هل أنت متأكد من حذف <span className="text-white font-bold">&quot;{deleteConfirmation}&quot;</span>؟
              <br/>لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex w-full gap-3">
              <button 
                onClick={cancelDelete}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-900/20"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="p-6 pb-4 shrink-0 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-amber-400 to-orange-600">
                  <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                     {username && username.includes("ادم") ? (
                        <Image src="/adam.jpg" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                     ) : username && username.includes("نسرين") ? (
                        <Image src="/nesreen.jpg" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                     ) : username && username.includes("نور") ? (
                        <Image src="/noor.webp" alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-white font-bold text-lg">{username ? username.slice(0, 1) : 'U'}</span>
                     )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0f] rounded-full"></div>
              </div>
              
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{username || 'مستخدم'}</h3>
                <p className="text-gray-400 text-xs font-medium">الملف الشخصي</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-8 no-scrollbar relative z-10">
          
          {/* 1. Tabs / Sheets Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">دفاتر المتبرعين</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-medium">{sheets.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating(true);
                    setNewTabValue("");
                  }}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-colors"
                  title="إضافة دفتر جديد"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-1.5">
              {sheets.map((sheet) => {
                const isActive = currentSheet === sheet;
                const isEditing = editingSheet === sheet;

                if (isEditing) {
                  return (
                    <form 
                      key={sheet} 
                      onSubmit={saveEdit}
                      className="w-full p-2 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2"
                    >
                      <button 
                         type="button"
                         onClick={cancelEdit}
                         className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        type="submit"
                        className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-transparent border-none text-white text-sm font-bold text-right focus:outline-none placeholder-white/30 px-2 min-w-0"
                        placeholder="اسم الدفتر"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') cancelEdit(e as any);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </form>
                  );
                }

                return (
                  <div key={sheet} className="relative group/item">
                    <button
                      onClick={() => {
                        onSheetChange(sheet);
                        onViewChange('list'); 
                        handleClose();
                      }}
                      className={cn(
                        "w-full p-2.5 rounded-xl flex items-center justify-between transition-all border relative z-10",
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0",
                          isActive ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-white/5 text-gray-500"
                        )}>
                          <FolderOpen className="w-4.5 h-4.5 stroke-[2.5px]" />
                        </div>
                        <div className="text-right truncate min-w-0 flex-1">
                          <span className={cn("font-bold text-sm block truncate", isActive ? "text-white" : "text-gray-300 group-hover:text-white")}>
                            {sheet}
                          </span>
                          {isActive && <span className="text-[10px] text-amber-400 font-medium animate-pulse block">نشط الآن</span>}
                        </div>
                      </div>
                      
                      {/* Spacer to avoid overlap with actions if they were absolute, but we'll use conditional rendering or flex layout */}
                      <div className="w-16 sm:w-0" /> 
                    </button>
                    
                    {/* Action Buttons */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
                      {/* Mobile: Always visible (or maybe simplify?) Let's keep them visible but smaller */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(sheet, e)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-amber-400 flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => requestDelete(sheet, e)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Creation Form */}
              {isCreating && (
                <form 
                  onSubmit={saveNewTab}
                  className="w-full p-2 rounded-xl bg-white/10 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
                >
                  <button 
                     type="button"
                     onClick={cancelNewTab}
                     className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    type="submit"
                    className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <input
                    autoFocus
                    value={newTabValue}
                    onChange={(e) => setNewTabValue(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-sm font-bold text-right focus:outline-none placeholder-white/30 px-2 min-w-0"
                    placeholder="اسم الدفتر الجديد..."
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') cancelNewTab();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </form>
              )}
            </div>
          </div>

          {/* 2. Apps Section */}
          <div className="space-y-3">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider px-1">تطبيقات أخرى</h4>
            
            {/* Family App - Direct Link */}
            <button
               onClick={handleSwitchToFamilies}
               className="w-full p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/20 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/30 group-hover:scale-105 transition-transform duration-300">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-right flex-1">
                <div className="text-white font-bold text-base group-hover:text-violet-200 transition-colors">تطبيق العائلات</div>
                <div className="text-gray-400 text-xs font-medium">إدارة شؤون العائلات</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                 <Grid3X3 className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </div>
            </button>
          </div>

        </div>

        {/* Footer: Logout */}
        <div className="p-6 pt-4 shrink-0 relative z-10 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all flex items-center justify-center gap-2 group font-bold text-sm"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform stroke-[2.5px]" />
            تسجيل الخروج
          </button>
        </div>

      </div>
    </div>
  );
}
