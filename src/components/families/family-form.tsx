"use client";

import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Loader2,
  User,
  Briefcase,
  MapPin,
  Heart,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  FileText,
  ClipboardList,
  Calendar,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createFamily,
  updateFamily,
  getNextFamilyCode,
} from "@/app/families/actions";
import {
  STATUS_OPTIONS,
  GOVERNORATE_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  type Family,
  type Child,
  type Attachment,
} from "@/app/families/types";
import { ChildrenList } from "@/components/families/children-list";
import { CustomSelect } from "@/components/ui/custom-select";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import Image from "next/image";
import { toast } from "sonner";

interface FamilyFormProps {
  family?: Family | null;
  onClose: () => void;
  onSave: (
    pendingFiles?: { file: File; label: string }[],
    familyId?: number,
    familyCode?: number,
  ) => void;
  noOverlay?: boolean;
}

export function FamilyForm({
  family,
  onClose,
  onSave,
  noOverlay = false,
}: FamilyFormProps) {
  const isEditing = !!family;

  // Form State
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Track if any changes have been made
  const [isDirty, setIsDirty] = useState(false);

  // Family Data
  const [familyCode, setFamilyCode] = useState(family?.family_code || 0);
  const [status, setStatus] = useState(family?.status || "أسرة رقيقة الحال");

  // Wife Data
  const [wifeName, setWifeName] = useState(family?.wife_name || "");
  const [wifeNationalId, setWifeNationalId] = useState(
    family?.wife_national_id || "",
  );
  const [wifePhone, setWifePhone] = useState(family?.wife_phone || "");
  const [wifeJob, setWifeJob] = useState(family?.wife_job || "لا تعمل");

  // Husband Data
  const [husbandName, setHusbandName] = useState(family?.husband_name || "");
  const [husbandStatus, setHusbandStatus] = useState(
    family?.husband_status || "متواجد",
  );
  const [husbandNationalId, setHusbandNationalId] = useState(
    family?.husband_national_id || "",
  );
  const [husbandPhone, setHusbandPhone] = useState(family?.husband_phone || "");
  const [husbandJob, setHusbandJob] = useState(
    family?.husband_job || "لا يعمل",
  );

  // Housing & Financials
  const [governorate, setGovernorate] = useState(family?.governorate || "");
  const [area, setArea] = useState(family?.area || "");
  const [street, setStreet] = useState(family?.street || "");
  const [housingType, setHousingType] = useState(
    family?.housing_type || "إيجار",
  );
  const [address, setAddress] = useState(family?.address || "");
  const [housingCondition, setHousingCondition] = useState(
    family?.housing_condition || "",
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number | undefined>(
    family?.monthly_income || undefined,
  );
  const [incomeDetails, setIncomeDetails] = useState(
    family?.income_details || "",
  );
  const [notes, setNotes] = useState(family?.notes || "");

  // Researcher Info
  const [researchDate, setResearchDate] = useState(
    family ? (family.research_date || "") : new Date().toISOString().split('T')[0]
  );
  const [researcherName, setResearcherName] = useState(
    family?.researcher_name || "",
  );
  const [researcherPhone, setResearcherPhone] = useState(
    family?.researcher_phone || "",
  );
  const [researcherPerspective, setResearcherPerspective] = useState(
    family?.researcher_perspective || "",
  );
  const [referencePerson, setReferencePerson] = useState(
    family?.reference_person || "",
  );
  const [referencePhone, setReferencePhone] = useState(
    family?.reference_phone || "",
  );

  // Children
  const [children, setChildren] = useState<Child[]>(family?.children || []);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>(
    family?.attachments || [],
  );
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; label: string; typeId?: string }[]
  >([]);
  const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);

  // Section States
  const [expandedSections, setExpandedSections] = useState({
    wife: true,
    husband: true,
    housing: true,
    research: true,
    children: true,
    attachments: true,
  });

  // Prevent background scroll and overscroll on touch devices
  useEffect(() => {
    let lastY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const modal = document.getElementById("family-form-content");
      if (!modal) return;

      // If touch is outside modal, prevent scroll
      if (!modal.contains(e.target as Node)) {
        e.preventDefault();
        return;
      }

      // Check if at scroll boundaries
      const currentY = e.touches[0].clientY;
      const isScrollingUp = currentY > lastY;
      const isScrollingDown = currentY < lastY;
      const isAtTop = modal.scrollTop <= 0;
      const isAtBottom =
        modal.scrollTop + modal.clientHeight >= modal.scrollHeight;

      // Prevent overscroll at boundaries
      if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
        e.preventDefault();
      }

      lastY = currentY;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Get next family code for new families
  useEffect(() => {
    const getCode = async () => {
      if (!isEditing) {
        const nextCode = await getNextFamilyCode();
        setFamilyCode(nextCode);
      }
    };
    getCode();
  }, [isEditing]);

  // Custom setter to mark form as dirty
  const handleFieldChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: React.SetStateAction<T>,
  ) => {
    setter(value);
    setIsDirty(true);
  };

  // Custom close handler to warn if dirty
  const handleSafeClose = () => {
    if (isDirty) {
      if (
        window.confirm("هناك تعديلات لم يتم حفظها. هل أنت متأكد من الإغلاق؟")
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Toggle section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle file selection (store locally, don't upload yet)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPendingFiles = Array.from(files).map((file) => ({
      file,
      label: "", // No default name, user must select
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    setIsDirty(true);
    toast.success(`تم إضافة ${files.length} ملف للرفع`);

    // Reset input
    e.target.value = "";
  };

  // Remove pending file
  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const attachment = attachments[index];
    if (attachment.public_id) {
      setDeletedAttachments((prev) => [...prev, attachment.public_id]);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Renaming State

  // Submit
  const handleSubmit = async () => {
    // Validation
    if (!wifeName.trim()) {
      toast.error("اسم الزوجة مطلوب");
      return;
    }

    // Validate pending files have labels
    if (pendingFiles.some((f) => !f.label)) {
      toast.error("يرجى اختيار نوع (تصنيف) لكل ملف جديد");
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Family Data
      // Don't include pending files here, they will be added after upload
      const familyData = {
        family_code: familyCode,
        wife_name: wifeName.trim(),
        wife_national_id: wifeNationalId.trim() || undefined,
        wife_phone: wifePhone.trim() || undefined,
        wife_job: wifeJob.trim() || "لا تعمل",
        husband_name: husbandName.trim() || undefined,
        husband_status: husbandStatus,
        husband_national_id: husbandNationalId.trim() || undefined,
        husband_phone: husbandPhone.trim() || undefined,
        husband_job: husbandJob.trim() || "لا يعمل",
        governorate: governorate || undefined,
        area: area.trim() || undefined,
        street: street.trim() || undefined,
        housing_type: housingType || undefined,
        address: address.trim() || undefined,
        housing_condition: housingCondition.trim() || undefined,
        monthly_income: monthlyIncome || undefined,
        income_details: incomeDetails.trim() || undefined,
        status: status,
        attachments: attachments, // Existing attachments only
        research_date: researchDate || undefined,
        researcher_name: researcherName.trim() || undefined,
        researcher_phone: researcherPhone.trim() || undefined,
        researcher_perspective: researcherPerspective.trim() || undefined,
        reference_person: referencePerson.trim() || undefined,
        reference_phone: referencePhone.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      let result;

      // 2. Save Family Data
      if (family) {
        result = await updateFamily(
          family.id!,
          familyData,
          children,
          deletedAttachments,
        );
      } else {
        result = await createFamily(familyData, children);
      }

      if (!result.success) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      // 3. Close and Delegate Uploads (Non-blocking)
      const familyId =
        family?.id || (result as { success: true; data: Family }).data.id;

      if (!familyId) {
        throw new Error("Failed to get family ID");
      }

      toast.success(
        family ? "تم تحديث البيانات بنجاح" : "تم إضافة الأسرة بنجاح",
      );

      // Close immediateley
      onClose();

      // Pass to parent to handle background uploads if any
      if (pendingFiles.length > 0) {
        onSave(pendingFiles, familyId, familyCode);
      } else {
        onSave([], familyId, familyCode);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
      // uploading state is no longer used here
    }
  };

  const content = (
    <>
      <div
        className={cn(
          "bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col",
          // Animation: Consistent full slide up (duration tuned)
          isEditing
            ? "animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95"
            : "animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-black text-gray-900">
            {isEditing ? "تعديل الأسرة" : "إضافة أسرة جديدة"}
          </h2>
          <button
            onClick={handleSafeClose}
            className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - with scroll containment */}
        <div
          id="family-form-content"
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
        >
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Status */}
              <div>
                <CustomSelect
                  label="حالة الأسرة"
                  value={status}
                  onChange={(v) => handleFieldChange(setStatus, v)}
                  options={STATUS_OPTIONS}
                />
              </div>

              {/* === RESEARCH INFO SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("research")}
                  className="w-full flex items-center justify-between p-3 bg-teal-50 text-teal-700"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span className="font-bold">بيانات البحث</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.research && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.research && (
                  <div className="p-3 space-y-3">
                    {/* Research Date */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        تاريخ البحث
                      </label>
                      <div className="flex gap-2">
                        <div
                          className="relative flex-1 h-11 rounded-xl border-2 border-gray-200 focus-within:border-teal-500 bg-white overflow-hidden transition-colors cursor-pointer"
                          onClick={() => {
                            const input = document.getElementById(
                              "research-date-input",
                            ) as HTMLInputElement;
                            if (input) {
                              try {
                                input.showPicker();
                              } catch {
                                input.focus();
                              }
                            }
                          }}
                        >
                          <input
                            id="research-date-input"
                            type="date"
                            value={researchDate}
                            onChange={(e) =>
                              handleFieldChange(setResearchDate, e.target.value)
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center h-full gap-2 pointer-events-none">
                            {researchDate ? (
                              <span className="text-sm font-black text-gray-800">
                                {new Date(researchDate).toLocaleDateString(
                                  "ar-EG",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 text-teal-400" />
                                <span className="text-sm font-bold text-gray-400">
                                  اختر التاريخ
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(
                              setResearchDate,
                              new Date().toISOString().split("T")[0],
                            )
                          }
                          className="h-11 px-3 rounded-xl bg-teal-50 text-teal-600 font-bold text-xs border-2 border-teal-200 hover:bg-teal-100 transition-colors whitespace-nowrap active:scale-95"
                        >
                          اليوم
                        </button>
                      </div>
                    </div>

                    {/* Researcher Name + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          اسم الباحث
                        </label>
                        <input
                          type="text"
                          value={researcherName}
                          onChange={(e) =>
                            handleFieldChange(setResearcherName, e.target.value)
                          }
                          placeholder="اسم الباحث"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none font-medium text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          هاتف الباحث
                        </label>
                        <input
                          type="tel"
                          value={researcherPhone}
                          onChange={(e) =>
                            handleFieldChange(
                              setResearcherPhone,
                              e.target.value,
                            )
                          }
                          placeholder="01xxxxxxxxx"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none font-medium text-center"
                        />
                      </div>
                    </div>

                    {/* Researcher Perspective */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        وجهة نظر الباحث
                      </label>
                      <textarea
                        value={researcherPerspective}
                        onChange={(e) =>
                          handleFieldChange(
                            setResearcherPerspective,
                            e.target.value,
                          )
                        }
                        placeholder="رأي الباحث في حالة الأسرة..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none font-medium text-right resize-none"
                      />
                    </div>

                    {/* Reference Person + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          الفرد الدليل
                        </label>
                        <input
                          type="text"
                          value={referencePerson}
                          onChange={(e) =>
                            handleFieldChange(
                              setReferencePerson,
                              e.target.value,
                            )
                          }
                          placeholder="اسم الفرد الدليل"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none font-medium text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          هاتف الدليل
                        </label>
                        <input
                          type="tel"
                          value={referencePhone}
                          onChange={(e) =>
                            handleFieldChange(setReferencePhone, e.target.value)
                          }
                          placeholder="01xxxxxxxxx"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none font-medium text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* === WIFE SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("wife")}
                  className="w-full flex items-center justify-between p-3 bg-pink-50 text-pink-700"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="font-bold">بيانات الزوجة</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.wife && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.wife && (
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        الاسم الرباعي *
                      </label>
                      <input
                        type="text"
                        value={wifeName}
                        onChange={(e) =>
                          handleFieldChange(setWifeName, e.target.value)
                        }
                        placeholder="اسم الزوجة رباعي"
                        className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          الرقم القومي
                        </label>
                        <input
                          type="text"
                          value={wifeNationalId}
                          onChange={(e) =>
                            handleFieldChange(setWifeNationalId, e.target.value)
                          }
                          placeholder="14 رقم"
                          maxLength={14}
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={wifePhone}
                          onChange={(e) =>
                            handleFieldChange(setWifePhone, e.target.value)
                          }
                          placeholder="01xxxxxxxxx"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        العمل
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(setWifeJob as any, "لا تعمل")
                          }
                          className={cn(
                            "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                            wifeJob === "لا تعمل"
                              ? "bg-gray-700 text-white"
                              : "bg-gray-100 text-gray-500 border border-gray-200",
                          )}
                        >
                          لا تعمل
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (wifeJob === "لا تعمل")
                              handleFieldChange(setWifeJob as any, "تعمل");
                          }}
                          className={cn(
                            "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                            wifeJob !== "لا تعمل"
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-500 border border-gray-200",
                          )}
                        >
                          تعمل
                        </button>
                      </div>
                      {wifeJob !== "لا تعمل" && (
                        <input
                          type="text"
                          value={wifeJob === "تعمل" ? "" : wifeJob}
                          onChange={(e) =>
                            handleFieldChange(
                              setWifeJob,
                              e.target.value || "تعمل",
                            )
                          }
                          placeholder="ما هو عملها؟"
                          className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* === HUSBAND SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("husband")}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-bold">بيانات الزوج</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.husband && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.husband && (
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        اسم الزوج
                      </label>
                      <input
                        type="text"
                        value={husbandName}
                        onChange={(e) =>
                          handleFieldChange(setHusbandName, e.target.value)
                        }
                        placeholder="اسم الزوج"
                        className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        حالة الزوج
                      </label>
                      <div className="flex gap-2">
                        {["متواجد", "متوفي"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              handleFieldChange(setHusbandStatus, opt)
                            }
                            className={cn(
                              "flex-1 h-10 rounded-lg font-bold transition-all",
                              husbandStatus === opt
                                ? opt === "متوفي"
                                  ? "bg-red-500 text-white"
                                  : "bg-emerald-500 text-white"
                                : "bg-gray-100 text-gray-600",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {husbandStatus === "متواجد" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              الرقم القومي
                            </label>
                            <input
                              type="text"
                              value={husbandNationalId}
                              onChange={(e) =>
                                handleFieldChange(
                                  setHusbandNationalId,
                                  e.target.value,
                                )
                              }
                              placeholder="14 رقم"
                              maxLength={14}
                              className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              رقم الهاتف
                            </label>
                            <input
                              type="tel"
                              value={husbandPhone}
                              onChange={(e) =>
                                handleFieldChange(
                                  setHusbandPhone,
                                  e.target.value,
                                )
                              }
                              placeholder="01xxxxxxxxx"
                              className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            العمل
                          </label>
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(
                                  setHusbandJob as any,
                                  "لا يعمل",
                                )
                              }
                              className={cn(
                                "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                                husbandJob === "لا يعمل"
                                  ? "bg-gray-700 text-white"
                                  : "bg-gray-100 text-gray-500 border border-gray-200",
                              )}
                            >
                              لا يعمل
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (husbandJob === "لا يعمل")
                                  handleFieldChange(
                                    setHusbandJob as any,
                                    "يعمل",
                                  );
                              }}
                              className={cn(
                                "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                                husbandJob !== "لا يعمل"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-gray-100 text-gray-500 border border-gray-200",
                              )}
                            >
                              يعمل
                            </button>
                          </div>
                          {husbandJob !== "لا يعمل" && (
                            <input
                              type="text"
                              value={husbandJob === "يعمل" ? "" : husbandJob}
                              onChange={(e) =>
                                handleFieldChange(
                                  setHusbandJob,
                                  e.target.value || "يعمل",
                                )
                              }
                              placeholder="ما هو عمله؟"
                              className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                              autoFocus
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* === HOUSING SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("housing")}
                  className="w-full flex items-center justify-between p-3 bg-amber-50 text-amber-700"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold">السكن والدخل</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.housing && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.housing && (
                  <div className="p-3 space-y-3">
                    {/* Governorate & Area */}
                    <div className="grid grid-cols-2 gap-3">
                      <CustomSelect
                        label="المحافظة"
                        value={governorate}
                        onChange={(v) => handleFieldChange(setGovernorate, v)}
                        options={[...GOVERNORATE_OPTIONS]}
                        placeholder="اختر المحافظة"
                      />
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          المنطقة
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) =>
                            handleFieldChange(setArea, e.target.value)
                          }
                          placeholder="اسم المنطقة"
                          className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                        />
                      </div>
                    </div>
                    {/* Street */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        الشارع
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) =>
                          handleFieldChange(setStreet, e.target.value)
                        }
                        placeholder="اسم الشارع ورقم المنزل"
                        className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                      />
                    </div>
                    {/* Housing Type Chips */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        نوع السكن
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(setHousingType as any, "إيجار")
                          }
                          className={cn(
                            "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                            housingType === "إيجار"
                              ? "bg-amber-500 text-white"
                              : "bg-gray-100 text-gray-500 border border-gray-200",
                          )}
                        >
                          إيجار
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(setHousingType as any, "تمليك")
                          }
                          className={cn(
                            "flex-1 h-9 rounded-lg text-sm font-bold transition-all",
                            housingType === "تمليك"
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-500 border border-gray-200",
                          )}
                        >
                          تمليك
                        </button>
                      </div>
                    </div>
                    {/* Housing Condition */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        حالة السكن
                      </label>
                      <input
                        type="text"
                        value={housingCondition}
                        onChange={(e) =>
                          handleFieldChange(setHousingCondition, e.target.value)
                        }
                        placeholder="مثال: سقف يحتاج ترميم"
                        className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right"
                      />
                    </div>
                    {/* Monthly Income */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        الدخل الشهري
                      </label>
                      <input
                        type="number"
                        value={monthlyIncome || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            setMonthlyIncome,
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder="مثال: 1500"
                        className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-center"
                      />
                    </div>
                    {/* Income Details */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        تفاصيل الدخل
                      </label>
                      <textarea
                        value={incomeDetails}
                        onChange={(e) =>
                          handleFieldChange(setIncomeDetails, e.target.value)
                        }
                        placeholder="مثال: 500 معاش، 200 مساعدة..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right resize-none"
                      />
                    </div>
                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        ملاحظات
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) =>
                          handleFieldChange(setNotes, e.target.value)
                        }
                        placeholder="أي ملاحظات إضافية..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-violet-500 outline-none font-medium text-right resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* === CHILDREN SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("children")}
                  className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-bold">
                      الأبناء ({children.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.children && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.children && (
                  <div className="p-3">
                    <ChildrenList
                      items={children}
                      onChange={(c) => handleFieldChange(setChildren, c)}
                    />
                  </div>
                )}
              </div>

              {/* === ATTACHMENTS SECTION === */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("attachments")}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 text-purple-700"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-bold">
                      المرفقات ({attachments.length + pendingFiles.length})
                    </span>
                    {pendingFiles.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {pendingFiles.length} جديد
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedSections.attachments && "rotate-180",
                    )}
                  />
                </button>

                {expandedSections.attachments && (
                  <div className="p-3 space-y-3">
                    {/* Upload Button */}
                    <label
                      className={cn(
                        "flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 font-bold cursor-pointer hover:bg-purple-50 transition-colors",
                      )}
                    >
                      <Upload className="w-5 h-5" />
                      <span>اختيار صور</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Pending Files (Smart Labeling) */}
                    {pendingFiles.length > 0 && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-amber-600">
                            ملفات جديدة ({pendingFiles.length})
                          </div>
                          <span className="text-[10px] text-gray-400">
                            اضغط على التصنيف لتسمية الملف
                          </span>
                        </div>

                        <div className="space-y-3">
                          {pendingFiles.map((pf, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-xl p-3 border border-gray-100 transition-all hover:border-amber-200 hover:shadow-sm"
                            >
                              {/* Changed items-start to items-center for vertical alignment */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                  {pf.file.type.startsWith("image/") ? (
                                    <Image
                                      src={URL.createObjectURL(pf.file)}
                                      alt="New file"
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Briefcase className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    {/* Show filename ONLY if not labeled yet */}
                                    {!pf.label && (
                                      <p
                                        className="text-xs font-medium text-gray-500 truncate max-w-[150px]"
                                        dir="ltr"
                                      >
                                        {pf.file.name}
                                      </p>
                                    )}

                                    {/* If labeled, show label as main title */}
                                    {pf.label && (
                                      <p className="text-sm font-bold text-gray-900">
                                        {pf.label}
                                      </p>
                                    )}

                                    <button
                                      onClick={() => removePendingFile(index)}
                                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors" // Red style
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Helper text if not labeled */}
                                  {!pf.label && (
                                    <div className="h-6 flex items-center">
                                      <p className="text-xs text-red-500 animate-pulse font-medium">
                                        اختر تصنيف الملف 👇
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Smart Chips - Wrap on all devices */}
                              <div className="flex flex-wrap gap-2 pb-2">
                                {DOCUMENT_TYPES.map((type) => (
                                  <button
                                    key={type.id}
                                    onClick={() => {
                                      const newFiles = [...pendingFiles];
                                      newFiles[index].label = type.label;
                                      newFiles[index].typeId = type.id;
                                      setPendingFiles(newFiles);
                                    }}
                                    className={cn(
                                      "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                      pf.label === type.label
                                        ? `${type.color} border-transparent ring-2 ring-white shadow-sm scale-105`
                                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                                    )}
                                  >
                                    {type.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Attachments */}
                    {attachments.length > 0 && (
                      <div>
                        {pendingFiles.length > 0 && (
                          <div className="text-xs font-bold text-gray-500 mb-2">
                            مرفقات محفوظة
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {attachments.map((att, index) => (
                            <div key={index} className="relative group">
                              {att.url.toLowerCase().endsWith(".pdf") ? (
                                <div className="w-full aspect-square bg-red-50 rounded-lg flex flex-col items-center justify-center border border-red-100 text-red-500">
                                  <FileText className="w-8 h-8 mb-1" />
                                  <span className="text-[10px] font-bold">
                                    PDF
                                  </span>
                                </div>
                              ) : (
                                <Image
                                  src={att.url}
                                  alt={att.label}
                                  width={100}
                                  height={100}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              {/* Label (Static) */}
                              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center truncate rounded-b-lg">
                                {att.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
          <button
            onClick={handleSubmit}
            disabled={loading || loadingData}
            className={cn(
              "w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all",
              loading || loadingData
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-l from-violet-500 via-purple-500 to-fuchsia-500 shadow-lg shadow-purple-200 hover:shadow-xl active:scale-[0.98]",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>
                {isEditing
                  ? "حفظ التعديلات"
                  : `إضافة الأسرة${pendingFiles.length > 0 ? ` (${pendingFiles.length} ملف)` : ""}`}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );

  if (noOverlay) return content;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleSafeClose}
    >
      {content}
    </div>
  );
}
