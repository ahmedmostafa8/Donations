"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Note for USER:
 * Please ensure your Supabase project has the following tables:
 * 1. `categories` (name text primary key)
 * 2. `transactions` (id bigint primary key generated always as identity, created_at timestamp with time zone default now(), name text, amount numeric, note text, category text references categories(name) on delete cascade)
 */

export async function getSheets() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name', { ascending: true });

    if (error) throw error;
    
    const categories = data.map(c => c.name);
    if (categories.length === 0) {
        // Ensure at least one category exists
        await createSheet("Donation");
        return ["Donation"];
    }
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ["Donation"];
  }
}

export async function createSheet(sheetName: string) {
  try {
    const { error } = await supabase
      .from('categories')
      .insert([{ name: sheetName }]);

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
      .eq('name', sheetName);

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "فشل في حذف التصنيف" };
  }
}

export async function getTransactions(sheetName: string = "Donation") {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', sheetName)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(t => ({
      id: t.id,
      date: new Date(t.created_at).toLocaleString('ar-EG', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit' 
      }),
      name: t.name,
      amount: parseFloat(t.amount) || 0,
      note: t.note,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function addTransaction(formData: FormData, sheetName: string = "Donation") {
  const name = formData.get("name") as string;
  const amount = formData.get("amount") as string;
  const note = formData.get("note") as string;

  if (!name || !amount) {
    throw new Error("Missing required fields");
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        name,
        amount: parseFloat(amount),
        note: note || "",
        category: sheetName
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
      .eq('category', sheetName);

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
      .eq('id', id);

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
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false };
  }
}
