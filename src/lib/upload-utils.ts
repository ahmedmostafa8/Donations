
import { uploadToCloudinary } from "./cloudinary";
import { addFamilyAttachment } from "@/app/families/actions";
import { toast } from "sonner";

/**
 * Handles background uploads for a family
 * This function is designed to run even after the triggering component unmounts
 */
export async function uploadFamilyAttachmentsUtils(
  files: { file: File; label: string; typeId?: string }[],
  familyId: number,
  familyCode: number,
  onProgress?: (current: number, total: number) => void,
  onFileSuccess?: (index: number) => void
) {
  if (files.length === 0) return;

  const total = files.length;
  let successCount = 0;
  let failCount = 0;
  
  // Initial toast
  const toastId = toast.loading(`جاري رفع ${total} ملف...`, {
    duration: Infinity, // Keep open until done
  });

  try {
    for (const [index, { file, label }] of files.entries()) {
      // Update toast progress
      toast.loading(`جاري رفع الملف (${index + 1}/${total}): ${label}`, {
        id: toastId,
      });

      // Update UI progress
      if (onProgress) {
        onProgress(index + 1, total);
      }

      try {
        // 1. Upload to Cloudinary
        const result = await uploadToCloudinary(file, familyCode, label, (files[index] as any).typeId);
        
        if (!result) {
          throw new Error("Cloudinary upload failed");
        }

        // 2. Add to Database
        const dbResult = await addFamilyAttachment(familyId, result);
        
        if (!dbResult.success) {
          throw new Error("Database update failed");
        }

        successCount++;
        if (onFileSuccess) onFileSuccess(index);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        failCount++;
      }
    }

    // Final toast
    if (failCount === 0) {
      toast.success(`تم رفع ${total} ملف بنجاح ✅`, {
        id: toastId,
        duration: 4000
      });
    } else if (successCount > 0) {
      toast.warning(`تم رفع ${successCount} ملف، وفشل ${failCount}`, {
        id: toastId,
        duration: 5000
      });
    } else {
      toast.error(`فشل رفع جميع الملفات ❌`, {
        id: toastId,
        duration: 5000
      });
    }
  } catch (error) {
    console.error("Critical upload error:", error);
    toast.error("حدث خطأ غير متوقع أثناء الرفع", {
      id: toastId
    });
  }
}
