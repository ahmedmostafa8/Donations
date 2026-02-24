// Cloudinary Configuration for Families App
// Each family has its own folder: families/{family_code}/
// Each attachment is named by its label

export const CLOUDINARY_CONFIG = {
  cloudName: 'drb4lcbrs',
  apiKey: '592378825799632',
  uploadPreset: 'families_unsigned', // Create this in Cloudinary dashboard
};

export interface UploadResult {
  url: string;
  public_id: string;
  label: string;
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload
 * @param familyCode - Family code for folder organization
 * @param label - Label/name for the attachment
 */
export async function uploadToCloudinary(
  file: File,
  familyCode: number,
  label: string,
  typeId?: string
): Promise<UploadResult | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', `families/${familyCode}`);
    // Use full label for filename as requested (e.g. 'بطاقة الرقم القومي')
    // We replace spaces with underscores to keep it clean but preserve Arabic
    let filenamePrefix = label.trim().replace(/\s+/g, '_');
    
    // Only use typeId if label is missing (fallback)
    if (!filenamePrefix) {
      filenamePrefix = typeId || 'attachment';
    }

    // Append a short unique suffix to allow multiple files with the same label
    // e.g. شهادة_ميلاد_a1b2c3 — so duplicates don't overwrite each other
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    formData.append('public_id', `${filenamePrefix}_${uniqueSuffix}`);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    
    return {
      url: data.secure_url,
      public_id: data.public_id,
      label: label,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Re-throw to be caught by the caller
    throw error;
  }
}

/**
 * Delete file from Cloudinary
 * Note: This requires server-side API with signature for security
 * For now, we'll just remove from database
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    // Cloudinary deletion requires authenticated API call
    // This would typically be done server-side
    // For now, we'll handle this via a server action
    console.log('Delete from Cloudinary:', publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get thumbnail URL for an image
 */
export function getThumbnailUrl(url: string, width = 200, height = 200): string {
  if (!url.includes('cloudinary.com')) return url;
  
  // Insert transformation before /upload/
  return url.replace(
    '/upload/',
    `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`
  );
}

/**
 * Get optimized URL for display
 */
export function getOptimizedUrl(url: string, width = 800): string {
  if (!url.includes('cloudinary.com')) return url;
  
  return url.replace(
    '/upload/',
    `/upload/c_limit,w_${width},q_auto,f_auto/`
  );
}
