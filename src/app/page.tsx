import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "./actions";
import { AppSelector } from "@/components/app-selector";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Server-side auth check
  const cookieStore = await cookies();
  const user = cookieStore.get("app_user")?.value;
  if (!user) redirect("/login");

  const userProfile = await getUserProfile();
  const username = userProfile?.displayName || userProfile?.username || "User";

  return <AppSelector username={username} />;
}
