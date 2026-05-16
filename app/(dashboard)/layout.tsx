import { redirect }        from "next/navigation";
import { requireAuth }     from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Must have completed full onboarding
  if (!user.phone_verified) redirect("/verify-otp");
  if (!user.role)            redirect("/select-role");

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}