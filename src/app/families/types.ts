// Family Types and Constants
// Separated from actions.ts because "use server" files can only export async functions

export interface Child {
  id?: number;
  child_type: string; // ابن / ابنة
  child_name: string;
  child_age?: number;
  child_education?: string;
}

export const EDUCATION_OPTIONS = [
  "حضانة",
  "الإبتدائية",
  "الاعدادية",
  "الثانوية",
  "الجامعية",
  "أمي",
] as const;

export interface Attachment {
  url: string;
  label: string;
  public_id: string;
}

export interface Family {
  id?: number;
  family_code: number;
  
  // Wife
  wife_name: string;
  wife_national_id?: string;
  wife_phone?: string;
  wife_job?: string;
  
  // Husband
  husband_name?: string;
  husband_status?: string; // متوفي / متواجد
  husband_national_id?: string;
  husband_phone?: string;
  husband_job?: string;
  
  // Housing & Financials
  governorate?: string;
  area?: string;
  street?: string;
  housing_type?: string;
  address?: string;
  housing_condition?: string;
  monthly_income?: number;
  income_details?: string;
  
  // Status
  status: string;
  
  // Attachments
  attachments?: Attachment[];
  
  // Researcher Info
  research_date?: string;
  researcher_name?: string;
  researcher_phone?: string;
  researcher_perspective?: string;
  reference_person?: string;
  reference_phone?: string;
  
  // Notes
  notes?: string;
  
  // Children (for joined queries)
  children?: Child[];
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Status options for families
export const STATUS_OPTIONS = [
  "مرضي",
  "أيتام", 
  "ظروف خاصة",
  "أسرة رقيقة الحال",
  "أسرة غارمة",
  "مشروع باب رزق",
  "أسرة خارجية"
] as const;

export type FamilyStatus = typeof STATUS_OPTIONS[number];

// Color mapping for each status
export const STATUS_COLORS: Record<FamilyStatus, string> = {
  "مرضي": "red",
  "أيتام": "amber",
  "ظروف خاصة": "purple",
  "أسرة رقيقة الحال": "sky",
  "أسرة غارمة": "orange",
  "مشروع باب رزق": "emerald",
  "أسرة خارجية": "gray"
};

export const GOVERNORATE_OPTIONS = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "القليوبية",
  "المنوفية",
  "الغربية",
  "كفر الشيخ",
  "البحيرة",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
  "بني سويف",
  "الفيوم"
] as const;

export const HOUSING_TYPE_OPTIONS = [
  "إيجار",
  "تمليك"
] as const;
