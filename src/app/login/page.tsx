import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Server-side auth check (replaces middleware)
  const cookieStore = await cookies();
  const user = cookieStore.get("app_user")?.value;
  if (user) redirect("/");

  return <LoginForm />;
}
