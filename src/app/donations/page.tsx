import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardData } from "../actions";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DonationsPage() {
  // Server-side auth check
  const cookieStore = await cookies();
  const user = cookieStore.get("app_user")?.value;
  if (!user) redirect("/login");

  // Pre-fetch global data for SSR (Instant first load)
  const initialData = await getDashboardData();
  
  return (
    <Dashboard 
      initialSheets={initialData?.sheets || []}
      initialTransactions={initialData?.allTransactions || []}
      initialGoal={initialData?.goal || 0}
      initialUnitGoal={initialData?.unitGoal || null}
      initialUsername={initialData?.profile?.displayName || initialData?.profile?.username || "Unknown"}
    />
  );
}
