
import { getTransactions, getSheets } from "./actions";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sheets = await getSheets();
  const initialTransactions = await getTransactions(sheets[0] || "Donation");

  return <Dashboard initialSheets={sheets} initialTransactions={initialTransactions} />;
}
