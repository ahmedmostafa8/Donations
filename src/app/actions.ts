"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

export async function loginUser(username: string) {
  try {
    // Check if user exists
    const { data } = await supabase
      .from('app_users')
      .select('username')
      .eq('username', username)
      .single();

    if (!data) return { success: false, error: "User not found" };

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("app_user", username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true };
  } catch {
    return { success: false, error: "User not found" };
  }
}

export async function logoutUser() {
  (await cookies()).delete("app_user");
  revalidatePath("/");
  return { success: true };
}

export async function getCurrentUser() {
  return (await cookies()).get("app_user")?.value;
}

export async function getUserProfile() {
  const username = (await cookies()).get("app_user")?.value;
  if (!username) return null;

  try {
    const { data } = await supabase
      .from('app_users')
      .select('display_name')
      .eq('username', username)
      .single();
    
    return {
      username,
      displayName: data?.display_name || username
    };
  } catch {
    return { username, displayName: username };
  }
}

export async function getSheets() {
  try {
    const user = await getCurrentUser();
    if (!user) return ["تبرعاتي"]; // Silent return for unauthenticated revalidations

    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('owner_name', user)
      .order('name', { ascending: true });

    if (error) throw error;

    const categories = data.map(c => c.name);
    if (categories.length === 0) {
      // Ensure at least one category exists (Use upsert to avoid race conditions)
      const { error: insertError } = await supabase
        .from('categories')
        .upsert(
          [{ name: "تبرعاتي", owner_name: user }],
          { onConflict: 'name, owner_name', ignoreDuplicates: true }
        );

      if (insertError) console.error("Auto-create error details:", JSON.stringify(insertError, null, 2));

      return ["تبرعاتي"];
    }
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ["تبرعاتي"];
  }
}

export async function getCategoryGoal(sheetName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('categories')
      .select('target_amount')
      .eq('name', sheetName)
      .eq('owner_name', user)
      .single();

    if (error) return 0;
    return parseFloat(data.target_amount) || 0;
  } catch (e) {
    return 0;
  }
}

export async function updateCategoryGoal(sheetName: string, goal: number) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from('categories')
      .update({ target_amount: goal })
      .eq('name', sheetName)
      .eq('owner_name', user);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating goal:", error);
    return { success: false };
  }
}

// Transaction Helper Type
export interface Transaction {
  id: number;
  date: string;
  createdAt: string;
  name: string;
  amount: number;
  note: string | null;
  category: string;
}

// Unit Goal Types & Actions
export interface UnitGoalSettings {
  enabled: boolean;
  unitName: string;
  unitPrice: number;
  unitTarget: number;
}

export async function getUnitGoal(sheetName: string): Promise<UnitGoalSettings> {
  try {
    const user = await getCurrentUser();
    if (!user) return { enabled: false, unitName: '', unitPrice: 0, unitTarget: 0 };

    const { data, error } = await supabase
      .from('categories')
      .select('unit_enabled, unit_name, unit_price, unit_target')
      .eq('name', sheetName)
      .eq('owner_name', user)
      .single();

    if (error) return { enabled: false, unitName: '', unitPrice: 0, unitTarget: 0 };
    
    return {
      enabled: data.unit_enabled ?? false,
      unitName: data.unit_name ?? '',
      unitPrice: parseFloat(data.unit_price) || 0,
      unitTarget: parseInt(data.unit_target) || 0,
    };
  } catch {
    return { enabled: false, unitName: '', unitPrice: 0, unitTarget: 0 };
  }
}

export async function updateUnitGoal(sheetName: string, settings: UnitGoalSettings) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from('categories')
      .update({
        unit_enabled: settings.enabled,
        unit_name: settings.unitName,
        unit_price: settings.unitPrice,
        unit_target: settings.unitTarget
      })
      .eq('name', sheetName)
      .eq('owner_name', user);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating unit goal:", error);
    return { success: false };
  }
}

export async function createSheet(sheetName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from('categories')
      .insert([{ name: sheetName, owner_name: user }]);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "فشل في إنشاء التصنيف" };
  }
}

export async function deleteSheet(sheetName: string) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('name', sheetName)
      .eq('owner_name', await getCurrentUser());

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "فشل في حذف التصنيف" };
  }
}

export async function renameSheet(oldName: string, newName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Create new category
    const { error: createError } = await supabase
      .from('categories')
      .insert([{ name: newName, owner_name: user }]);

    if (createError) throw createError;

    // 2. Move transactions to new category
    const { error: moveError } = await supabase
      .from('transactions')
      .update({ category: newName })
      .eq('category', oldName)
      .eq('owner_name', user);

    if (moveError) throw moveError;

    // 3. Delete old category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('name', oldName)
      .eq('owner_name', user);

    if (deleteError) throw deleteError;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error renaming category:", error);
    return { success: false, error: "فشل في تغيير الاسم" };
  }
}

export async function getAllTransactions() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('owner_name', user)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      date: new Date(t.created_at).toLocaleString('ar-EG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
      createdAt: t.created_at,
      name: t.name,
      amount: parseFloat(t.amount) || 0,
      note: t.note,
      category: t.category, // Include category for client-side filtering
    }));
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    return [];
  }
}

export async function getTransactions(sheetName: string = "تبرعاتي") {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', sheetName)
      .eq('owner_name', user)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      date: new Date(t.created_at).toLocaleString('ar-EG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }),
      createdAt: t.created_at,
      name: t.name,
      amount: parseFloat(t.amount) || 0,
      note: t.note,
      category: t.category,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function addTransaction(formData: FormData, sheetName: string = "تبرعاتي") {
  const name = formData.get("name") as string;
  const amount = formData.get("amount") as string;
  const note = formData.get("note") as string;

  if (!name || !amount) {
    throw new Error("Missing required fields");
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from('transactions')
      .insert([{
        name,
        amount: parseFloat(amount),
        note: note || "",
        category: sheetName,
        owner_name: user
      }]);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { success: false, error: "فشل في حفظ العملية" };
  }
}

export async function clearAllTransactions(sheetName: string = "Donation") {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('category', sheetName)
      .eq('owner_name', await getCurrentUser());

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error clearing transactions:", error);
    return { success: false, error: "فشل في مسح البيانات" };
  }
}

export async function deleteTransaction(sheetName: string, id: number) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('owner_name', await getCurrentUser());

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false };
  }
}

export async function updateTransaction(sheetName: string, id: number, data: { name: string, amount: string, note: string }) {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        name: data.name,
        amount: parseFloat(data.amount),
        note: data.note || ""
      })
      .eq('id', id)
      .eq('owner_name', await getCurrentUser());

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false };
  }
}

// Unified Loader (Fetching ALL data for Turbo Mode)
export async function getDashboardData(sheetName: string = "تبرعاتي") {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, sheets, allTransactions] = await Promise.all([
     getUserProfile(),
     getSheets(),
     getAllTransactions(),
  ]);

  const targetSheet = sheets.includes(sheetName) ? sheetName : (sheets[0] || "تبرعاتي");

  const [goal, unitGoal] = await Promise.all([
     getCategoryGoal(targetSheet),
     getUnitGoal(targetSheet),
  ]);

  return {
    profile,
    sheets,
    activeSheet: targetSheet,
    allTransactions, // Global set for instant tab switching
    goal,
    unitGoal
  };
}

