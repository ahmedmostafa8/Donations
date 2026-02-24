"use client";

import { useState, useEffect } from "react";
import { 
  X, Pencil, Trash2, Phone, MessageCircle, Copy, User, MapPin, 
  Wallet, Heart, Briefcase, Users, ChevronDown, Loader2, Image as ImageIcon,
  ArrowLeft, ArrowRight, FileText, ClipboardList, Calendar
} from "lucide-react";
import { useCallback } from "react";
import { useSwipeTabs } from "@/hooks/use-swipe-tabs";
import { cn } from "@/lib/utils";
import { deleteFamily } from "@/app/families/actions";
import { STATUS_COLORS, type Family, type FamilyStatus } from "@/app/families/types";
import { getThumbnailUrl, getOptimizedUrl } from "@/lib/cloudinary";
import Image from "next/image";
import { toast } from "sonner";

interface FamilyDetailsProps {
  family: Family;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  noOverlay?: boolean;
}

export function FamilyDetails({ family: initialFamily, onClose, onEdit, onDelete, noOverlay = false }: FamilyDetailsProps) {
  const [family, setFamily] = useState(initialFamily);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // UI State for Collapsible Sections (Open by default per user request)
  const [showChildren, setShowChildren] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  
  // Image error state to handle broken links
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const attachments = family.attachments || [];

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev < attachments.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex, attachments.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : attachments.length - 1));
  }, [lightboxIndex, attachments.length]);

  const swipeHandlers = useSwipeTabs({
    onSwipeLeft: handleNext,   // Swipe Left -> Next
    onSwipeRight: handlePrev,  // Swipe Right -> Prev
    enabled: lightboxIndex !== null
  });

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') handlePrev(); 
      if (e.key === 'ArrowLeft') handleNext();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleNext, handlePrev]);
  
  // Update local state when prop changes
  useEffect(() => {
    setFamily(initialFamily);
  }, [initialFamily]);
  
  const statusColor = STATUS_COLORS[family.status as FamilyStatus] || "gray";
  
  // Copy to clipboard with fallback
  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(`تم نسخ ${label}`);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`تم نسخ ${label}`);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('فشل النسخ');
    }
  };
  
  // Open WhatsApp
  const openWhatsApp = (phone: string) => {
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '2' + normalizedPhone;
    }
    window.open(`https://wa.me/${normalizedPhone}`, '_blank');
  };
  
  // Open Phone
  const openPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };
  
  // Handle Delete
  const handleDelete = async () => {
    if (!family.id) return;
    
    setDeleting(true);
    const result = await deleteFamily(family.id);
    
    if (result.success) {
      toast.success("تم حذف الأسرة بنجاح");
      onDelete();
    } else {
      toast.error(result.error || "فشل في حذف الأسرة");
    }
    setDeleting(false);
  };
  
  // Status badge styles
  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    sky: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
    orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    gray: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" }
  };
  
  const style = statusStyles[statusColor] || statusStyles.gray;
  
  // Info Block component
  const InfoBlock = ({ icon: Icon, label, value, copyable, phone }: { 
    icon: React.ElementType; 
    label: string; 
    value?: string | null; 
    copyable?: boolean;
    phone?: boolean;
  }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-3 py-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="font-bold text-gray-800">{value}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          {copyable && (
            <button
              onClick={() => copyToClipboard(value, label)}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {phone && (
            <>
              <button
                onClick={() => openPhone(value)}
                className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center hover:bg-violet-200 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => openWhatsApp(value)}
                className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  const content = (
    <div 
      className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-200">
            {family.family_code}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">{family.wife_name}</h2>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold border",
              style.bg, style.text, style.border
            )}>
              {family.status}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

            {/* Research Info Section - FIRST */}
            {(family.research_date || family.researcher_name || family.researcher_perspective || family.reference_person) && (
              <div className="bg-teal-50 rounded-2xl p-5 shadow-sm border border-teal-100">
                <h3 className="font-black text-teal-800 flex items-center gap-2 mb-4 text-base">
                  <ClipboardList className="w-5 h-5" />
                  بيانات البحث
                </h3>
                <div className="space-y-1 divide-y divide-teal-200/50">
                  <InfoBlock icon={Calendar} label="تاريخ البحث" value={family.research_date ? new Date(family.research_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                  <InfoBlock icon={User} label="اسم الباحث" value={family.researcher_name} />
                  <InfoBlock icon={Phone} label="هاتف الباحث" value={family.researcher_phone} copyable phone />
                  {family.researcher_perspective && (
                    <div className="py-3">
                      <div className="text-xs text-teal-600 font-bold mb-2">وجهة نظر الباحث</div>
                      <div className="text-sm font-medium text-gray-800 bg-white rounded-xl p-4 leading-relaxed border border-teal-200 shadow-sm">{family.researcher_perspective}</div>
                    </div>
                  )}
                  <InfoBlock icon={User} label="الفرد الدليل" value={family.reference_person} />
                  <InfoBlock icon={Phone} label="هاتف الدليل" value={family.reference_phone} copyable phone />
                </div>
              </div>
            )}

            {/* Wife Section */}
            <div className="bg-pink-50 rounded-2xl p-5 shadow-sm border border-pink-100">
              <h3 className="font-black text-pink-800 flex items-center gap-2 mb-4 text-base">
                <Heart className="w-5 h-5" />
                بيانات الزوجة
              </h3>
              <div className="space-y-1 divide-y divide-pink-200/50">
                <InfoBlock icon={User} label="الاسم" value={family.wife_name} />
                <InfoBlock icon={Copy} label="الرقم القومي" value={family.wife_national_id} copyable />
                <InfoBlock icon={Phone} label="الهاتف" value={family.wife_phone} copyable phone />
                <InfoBlock icon={Briefcase} label="العمل" value={family.wife_job} />
              </div>
            </div>
            
            {/* Husband Section */}
            {family.husband_name && (
              <div className={cn(
                "rounded-2xl p-5 shadow-sm border",
                family.husband_status === "متوفي" ? "bg-gray-100 border-gray-200" : "bg-blue-50 border-blue-100"
              )}>
                <h3 className={cn(
                  "font-black flex items-center gap-2 mb-4 text-base",
                  family.husband_status === "متوفي" ? "text-gray-600" : "text-blue-800"
                )}>
                  <User className="w-5 h-5" />
                  بيانات الزوج
                  {family.husband_status === "متوفي" && (
                    <span className="text-red-500 text-sm font-bold">(متوفي)</span>
                  )}
                </h3>
                <div className={cn(
                  "space-y-1 divide-y",
                  family.husband_status === "متوفي" ? "divide-gray-200/50" : "divide-blue-200/50"
                )}>
                  <InfoBlock icon={User} label="الاسم" value={family.husband_name} />
                  {family.husband_status !== "متوفي" && (
                    <>
                      <InfoBlock icon={Copy} label="الرقم القومي" value={family.husband_national_id} copyable />
                      <InfoBlock icon={Phone} label="الهاتف" value={family.husband_phone} copyable phone />
                      <InfoBlock icon={Briefcase} label="العمل" value={family.husband_job} />
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Housing Section */}
            <div className="bg-amber-50 rounded-2xl p-5 shadow-sm border border-amber-100">
              <h3 className="font-black text-amber-800 flex items-center gap-2 mb-4 text-base">
                <MapPin className="w-5 h-5" />
                السكن والدخل
              </h3>
              <div className="space-y-1 divide-y divide-amber-200/50">
                <InfoBlock icon={MapPin} label="المحافظة" value={family.governorate} />
                <InfoBlock icon={MapPin} label="المنطقة" value={family.area} />
                <InfoBlock icon={MapPin} label="الشارع" value={family.street} />
                <InfoBlock icon={MapPin} label="نوع السكن" value={family.housing_type} />
                <InfoBlock icon={MapPin} label="حالة السكن" value={family.housing_condition} />
                <InfoBlock icon={Wallet} label="الدخل الشهري" value={family.monthly_income ? `${family.monthly_income} جنيه` : undefined} />
                <InfoBlock icon={Wallet} label="تفاصيل الدخل" value={family.income_details} />
              </div>
            </div>
            
            {/* Children Section (Collapsible) */}
            {family.children && family.children.length > 0 && (
              <div className="bg-green-50 rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => setShowChildren(!showChildren)}
                  className="w-full flex items-center justify-between p-4 text-green-700 font-bold hover:bg-green-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    الأبناء ({family.children.length})
                  </div>
                  <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", showChildren ? "rotate-180" : "")} />
                </button>
                
                {showChildren && (
                  <div className="grid grid-cols-2 gap-2 p-4 pt-0 animate-in slide-in-from-top-1 fade-in duration-200">
                    {family.children.map((child, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "p-2 rounded-lg",
                          child.child_type === "ابن" ? "bg-blue-100" : "bg-pink-100"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-bold",
                          child.child_type === "ابن" ? "text-blue-600" : "text-pink-600"
                        )}>
                          {child.child_type}
                        </div>
                        <div className="font-bold text-gray-800 text-sm">{child.child_name}</div>
                        {(child.child_age || child.child_education) && (
                          <div className="text-xs text-gray-500">
                            {child.child_age && `${child.child_age} سنة`}
                            {child.child_age && child.child_education && " - "}
                            {child.child_education}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Attachments Section (Collapsible) */}
            {family.attachments && family.attachments.length > 0 && (
              <div className="bg-purple-50 rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="w-full flex items-center justify-between p-4 text-purple-700 font-bold hover:bg-purple-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    المرفقات ({family.attachments.length})
                  </div>
                  <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", showAttachments ? "rotate-180" : "")} />
                </button>
                
                {showAttachments && (
                  <div className="grid grid-cols-3 gap-2 p-4 pt-0 animate-in slide-in-from-top-1 fade-in duration-200">
                    {family.attachments.map((att, index) => {
                      const isPdf = att.url.toLowerCase().endsWith('.pdf');
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (isPdf) {
                              window.open(att.url, '_blank');
                            } else {
                              setLightboxIndex(index);
                            }
                          }}
                          className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100"
                        >
                          {isPdf ? (
                            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center text-red-500">
                              <FileText className="w-8 h-8 mb-2" />
                              <span className="text-[10px] font-bold">فتح PDF</span>
                            </div>
                          ) : (
                            <>
                              {imageErrors[att.url] ? (
                                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                  <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                                  <span className="text-[10px] font-bold">صورة غير متوفرة</span>
                                </div>
                              ) : (
                                <Image
                                  src={getThumbnailUrl(att.url)}
                                  alt={att.label}
                                  width={100}
                                  height={100}
                                  className="w-full h-full object-cover"
                                  onError={() => setImageErrors(prev => ({ ...prev, [att.url]: true }))}
                                />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                            {att.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {/* Notes */}
            {family.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-2">ملاحظات</h3>
                <p className="text-gray-600 text-sm">{family.notes}</p>
              </div>
            )}

      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 h-11 rounded-xl bg-violet-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-violet-600 transition-colors active:scale-[0.98]"
        >
          <Pencil className="w-4 h-4" />
          <span>تعديل</span>
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="h-11 w-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors active:scale-[0.98]"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const subModals = (
    <>
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            dir="rtl"
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-gray-900 mb-2">حذف الأسرة؟</h3>
            <p className="text-gray-500 text-sm mb-6">
              هل أنت متأكد من حذف أسرة &quot;{family.wife_name}&quot;? لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Lightbox */}
      {lightboxIndex !== null && attachments[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex(null);
          }}
          {...swipeHandlers}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons (Desktop) */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80] hidden sm:flex"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80] hidden sm:flex"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 font-bold text-sm bg-black/50 px-3 py-1 rounded-full pointer-events-none">
            {lightboxIndex + 1} / {attachments.length}
          </div>

          <img
            src={getOptimizedUrl(attachments[lightboxIndex].url)}
            alt={attachments[lightboxIndex].label}
            className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200 select-none cursor-pointer"
            onClick={handleNext}
          />
          
          {/* Caption */}
          <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
             <span className="bg-black/50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                {attachments[lightboxIndex].label}
             </span>
          </div>
        </div>
      )}
    </>
  );

  if (noOverlay) return (
    <>
      {content}
      {subModals}
    </>
  );

  return (
    <>
      <div 
        dir="rtl"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {content}
      </div>
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            dir="rtl"
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-gray-900 mb-2">حذف الأسرة؟</h3>
            <p className="text-gray-500 text-sm mb-6">
              هل أنت متأكد من حذف أسرة &quot;{family.wife_name}&quot;? لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Lightbox */}
      {lightboxIndex !== null && attachments[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex(null);
          }}
          {...swipeHandlers}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80]"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons (Desktop) */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80] hidden sm:flex"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[80] hidden sm:flex"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 font-bold text-sm bg-black/50 px-3 py-1 rounded-full pointer-events-none">
            {lightboxIndex + 1} / {attachments.length}
          </div>

          <img
            src={getOptimizedUrl(attachments[lightboxIndex].url)}
            alt={attachments[lightboxIndex].label}
            className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200 select-none cursor-pointer"
            onClick={handleNext}
          />
          
          {/* Caption */}
          <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
             <span className="bg-black/50 text-white px-4 py-2 rounded-xl text-sm font-medium">
                {attachments[lightboxIndex].label}
             </span>
          </div>
        </div>
      )}
    </>
  );
}
