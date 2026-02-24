"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import {
  type Family,
  type Child,
  type Attachment,
  STATUS_OPTIONS
} from "./types";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (Server-Side)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Re-export types for convenience (types are allowed, objects are not)
export type { Family, Child, Attachment, FamilyStatus } from "./types";

// ============ Read Operations ============

export async function getFamilies(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 1000; // Optimized for CSR: fetch all (up to 1000)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('families')
      .select('*, children:family_children(*)', { count: 'exact' })
      .order('family_code', { ascending: true })
      .range(from, to);
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      // Aggressive sanitization: Only allow Arabic, English, Numbers, Spaces, and Hyphens
      // This prevents ANY special character injection that might break PostgREST or JSON parsing
      const s = filters.search.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim();
      
      if (s) {
        // Search in multiple columns
        const searchCondition = `wife_name.ilike.%${s}%,husband_name.ilike.%${s}%,wife_phone.ilike.%${s}%,husband_phone.ilike.%${s}%,wife_national_id.ilike.%${s}%,husband_national_id.ilike.%${s}%`;
        
        if (!isNaN(Number(s))) {
           // It's a number, so we also check for exact family_code match
           // Note: family_code is integer, so we use eq
           query = query.or(`${searchCondition},family_code.eq.${s}`);
        } else {
           // Text search only
           query = query.or(searchCondition);
        }
      } else {
         // Search turned out empty (e.g. only special chars), return no results
         return { data: [], count: 0, hasMore: false };
      }
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      data: data as Family[],
      count: count || 0,
      hasMore: (data?.length || 0) === limit // Simple heuristic
    };
  } catch (error) {
    console.error("Error fetching families:");
    if (typeof error === 'object' && error !== null) {
        try {
            console.error("Error JSON:", JSON.stringify(error, null, 2));
        } catch (e) {
            // Circular reference or simple error
        }
    }
    // Return empty result on error to prevent UI crash
    return { data: [], count: 0, hasMore: false };
  }
}

export async function getFamilyById(id: number) {
  try {
    // Get family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('id', id)
      .single();
    
    if (familyError) throw familyError;
    
    // Get children
    const { data: children, error: childrenError } = await supabase
      .from('family_children')
      .select('*')
      .eq('family_id', id)
      .order('id', { ascending: true });
    
    if (childrenError) throw childrenError;
    
    return { ...family, children: children || [] } as Family;
  } catch (error) {
    console.error("Error fetching family:", error);
    return null;
  }
}

export async function getNextFamilyCode() {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('family_code')
      .order('family_code', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return (data?.[0]?.family_code || 0) + 1;
  } catch (error) {
    console.error("Error getting next family code:", error);
    return 1;
  }
}

export async function getStatusCounts() {
  try {
    const { data: rawData, error } = await supabase
      .from('families')
      .select('status');
    
    if (error) {
      console.warn("Supabase fetch error:", error);
      return { total: 0 };
    }
    
    // Ensure data is array
    const data = rawData || [];
    
    const counts: Record<string, number> = {
      total: data.length
    };
    
    STATUS_OPTIONS.forEach(status => {
      counts[status] = data.filter(f => f.status === status).length;
    });
    
    return counts;
  } catch (error) {
    console.error("Error getting status counts:", error);
    return { total: 0 };
  }
}

// ============ Write Operations ============

export async function createFamily(data: Omit<Family, 'id' | 'created_at' | 'updated_at'>, children: Child[] = []) {
  try {
    // Insert family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert([{
        family_code: data.family_code,
        wife_name: data.wife_name,
        wife_national_id: data.wife_national_id || null,
        wife_phone: data.wife_phone || null,
        wife_job: data.wife_job || 'لا تعمل',
        husband_name: data.husband_name || null,
        husband_status: data.husband_status || 'متواجد',
        husband_national_id: data.husband_national_id || null,
        husband_phone: data.husband_phone || null,
        husband_job: data.husband_job || 'لا يعمل',
        governorate: data.governorate || null,
        area: data.area || null,
        street: data.street || null,
        housing_type: data.housing_type || null,
        address: data.address || null,
        housing_condition: data.housing_condition || null,
        monthly_income: data.monthly_income || null,
        income_details: data.income_details || null,
        status: data.status,
        attachments: data.attachments || [],
        research_date: data.research_date || null,
        researcher_name: data.researcher_name || null,
        researcher_phone: data.researcher_phone || null,
        researcher_perspective: data.researcher_perspective || null,
        reference_person: data.reference_person || null,
        reference_phone: data.reference_phone || null,
        notes: data.notes || null
      }])
      .select()
      .single();
    
    if (familyError) throw familyError;
    
    // Insert children if any
    if (children.length > 0) {
      const childrenData = children.map(child => ({
        family_id: family.id,
        child_type: child.child_type,
        child_name: child.child_name,
        child_age: child.child_age || null,
        child_education: child.child_education || null
      }));
      
      const { error: childrenError } = await supabase
        .from('family_children')
        .insert(childrenData);
      
      if (childrenError) throw childrenError;
    }
    
    revalidatePath("/families");
    return { success: true, data: family };
  } catch (error) {
    console.error("Error creating family:", error);
    return { success: false, error: (error as Error).message || "فشل في إنشاء الأسرة" };
  }
}

export async function updateFamily(
  id: number, 
  data: Partial<Family>, 
  children?: Child[],
  deletedAttachments?: string[]
) {
  try {
    // Handle deleted attachments (Cloudinary)
    if (deletedAttachments && deletedAttachments.length > 0) {
      console.log(`Processing deletion for ${deletedAttachments.length} attachments`);
      
      // Delete from Cloudinary
      if (process.env.CLOUDINARY_API_SECRET) {
        try {
          const deleteResults = await Promise.all(
            deletedAttachments.map(publicId => cloudinary.uploader.destroy(publicId))
          );
          console.log('Cloudinary Deletion Results:', deleteResults);
        } catch (cloudinaryError) {
          console.error('Failed to delete from Cloudinary:', cloudinaryError);
          // Only log error, don't fail the whole update
        }
      } else {
        console.warn('CLOUDINARY_API_SECRET not set. Skipping cloud deletion.');
      }
    }

    // Update family
    const { error: familyError } = await supabase
      .from('families')
      .update({
        family_code: data.family_code,
        wife_name: data.wife_name,
        wife_national_id: data.wife_national_id,
        wife_phone: data.wife_phone,
        wife_job: data.wife_job,
        husband_name: data.husband_name,
        husband_status: data.husband_status,
        husband_national_id: data.husband_national_id,
        husband_phone: data.husband_phone,
        husband_job: data.husband_job,
        governorate: data.governorate,
        area: data.area,
        street: data.street,
        housing_type: data.housing_type,
        address: data.address,
        housing_condition: data.housing_condition,
        monthly_income: data.monthly_income,
        income_details: data.income_details,
        status: data.status,
        attachments: data.attachments,
        research_date: data.research_date,
        researcher_name: data.researcher_name,
        researcher_phone: data.researcher_phone,
        researcher_perspective: data.researcher_perspective,
        reference_person: data.reference_person,
        reference_phone: data.reference_phone,
        notes: data.notes
      })
      .eq('id', id);
    
    if (familyError) throw familyError;
    
    // Update children if provided
    if (children !== undefined) {
      // Delete existing children
      await supabase
        .from('family_children')
        .delete()
        .eq('family_id', id);
      
      // Insert new children
      if (children.length > 0) {
        const childrenData = children.map(child => ({
          family_id: id,
          child_type: child.child_type,
          child_name: child.child_name,
          child_age: child.child_age || null,
          child_education: child.child_education || null
        }));
        
        const { error: childrenError } = await supabase
          .from('family_children')
          .insert(childrenData);
        
        if (childrenError) throw childrenError;
      }
    }
    
    revalidatePath("/families");
    return { success: true };
  } catch (error) {
    console.error("Error updating family:", error);
    return { success: false, error: (error as Error).message || "فشل في تحديث الأسرة" };
  }
}

export async function deleteFamily(id: number) {
  try {
    // 1. Get family attachments and family_code to delete from Cloudinary
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('attachments, family_code')
      .eq('id', id)
      .single();
      
    if (fetchError) console.error("Error fetching family for deletion:", fetchError);
    
    // 2. Delete attachments from Cloudinary
    if (family?.attachments && Array.isArray(family.attachments) && family.attachments.length > 0) {
       const attachments = family.attachments as Attachment[];
       const publicIds = attachments.map(att => att.public_id).filter(Boolean);
       
       if (publicIds.length > 0) {
         try {
           console.log(`Deleting ${publicIds.length} attachments for family ${id}`);
           await Promise.all(
             publicIds.map(id => cloudinary.uploader.destroy(id))
           );
         } catch (cloudError) {
           console.error("Failed to clean up Cloudinary files:", cloudError);
         }
       }
    }

    // 2.5 Delete the entire Cloudinary folder for this family
    if (family?.family_code && process.env.CLOUDINARY_API_SECRET) {
      try {
        const folderPrefix = `families/${family.family_code}`;
        // Delete any remaining resources in the folder
        await cloudinary.api.delete_resources_by_prefix(folderPrefix);
        // Delete the empty folder itself
        await cloudinary.api.delete_folder(folderPrefix);
        console.log(`Deleted Cloudinary folder: ${folderPrefix}`);
      } catch (folderError) {
        console.error("Failed to delete Cloudinary folder:", folderError);
      }
    }

    // 3. Delete from DB
    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Delete associated children
    const { error: childrenError } = await supabase
      .from('family_children')
      .delete()
      .eq('family_id', id);
      
    if (childrenError) console.error("Error deleting children:", childrenError);

    revalidatePath('/families');
    return { success: true };
  } catch (error) {
    console.error('Error deleting family:', error);
    return { success: false, error: (error as Error).message || "An error occurred" };
  }
}

// ============ Attachments ============

export async function updateFamilyAttachments(id: number, attachments: Attachment[]) {
  try {
    const { error } = await supabase
      .from('families')
      .update({ attachments })
      .eq('id', id);
    
    if (error) throw error;
    
    revalidatePath("/families");
    return { success: true };
  } catch (error) {
    console.error("Error updating attachments:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function addFamilyAttachment(id: number, attachment: Attachment) {
  try {
    // First get existing attachments
    const { data, error: fetchError } = await supabase
      .from('families')
      .select('attachments')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const existingAttachments = (data?.attachments as Attachment[]) || [];
    const newAttachments = [...existingAttachments, attachment];
    
    // Update with new list
    const { error: updateError } = await supabase
      .from('families')
      .update({ attachments: newAttachments })
      .eq('id', id);
      
    if (updateError) throw updateError;
    
    revalidatePath("/families");

    // 2.5 Update Cloudinary Metadata (Server-side)
    // Since unsigned uploads don't support context, we do it here
    if (process.env.CLOUDINARY_API_SECRET && attachment.public_id && attachment.label) {
      try {
        const label = attachment.label;
        await cloudinary.uploader.add_context(`caption=${label}|alt=${label}|title=${label}`, [attachment.public_id]);
        
        // Try updating display_name if possible
        await cloudinary.api.update(attachment.public_id, { 
          context: { caption: label, alt: label, title: label }
        });
      } catch (cloudError) {
        console.warn("Background metadata update failed:", cloudError);
        // Don't fail the request, just log it
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding attachment:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}


