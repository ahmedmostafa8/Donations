import { FamiliesDashboard } from "@/components/families";
import { getFamilies, getStatusCounts } from "./actions";

// Server Component (SSR)
export default async function FamiliesPage() {
  // Fetch data on the server (Instant Load)
  const [familiesResponse, counts] = await Promise.all([
    getFamilies({ page: 1, limit: 20 }),
    getStatusCounts(),
  ]);

  return (
    <FamiliesDashboard 
      initialFamilies={familiesResponse.data} 
      initialCounts={counts} 
    />
  );
}
export const dynamic = 'force-dynamic'; // Ensure fresh data on every request
