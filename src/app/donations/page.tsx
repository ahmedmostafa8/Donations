import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTransactions, getSheets, getCategoryGoal, getUnitGoal, getUserProfile } from "../actions";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DonationsPage() {
  // Server-side auth check
  const cookieStore = await cookies();
  const user = cookieStore.get("app_user")?.value;
  if (!user) redirect("/login");

  // We now let the Client Component (Dashboard) handle data fetching
  // This allows for "Instant Load" from cache and background syncing.
  
  return <Dashboard />;
}
