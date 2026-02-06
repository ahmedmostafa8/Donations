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

  const sheets = await getSheets();
  const firstSheet = sheets[0] || "Donation";
  
  // Parallel fetch all initial data
  const [initialTransactions, initialGoal, initialUnitGoal, userProfile] = await Promise.all([
    getTransactions(firstSheet),
    getCategoryGoal(firstSheet),
    getUnitGoal(firstSheet),
    getUserProfile()
  ]);

  return (
    <Dashboard
      initialSheets={sheets}
      initialTransactions={initialTransactions}
      initialGoal={initialGoal}
      initialUnitGoal={initialUnitGoal}
      initialUsername={userProfile?.displayName || userProfile?.username || "Unknown"}
    />
  );
}
