import { getAdminStatsAction } from "@/actions/admin";
import { AdminOverview }       from "@/components/admin/admin-overview";
import { redirect }            from "next/navigation";

export const metadata = { title: "Admin — WorkHub LK" };

export default async function AdminPage() {
  const stats = await getAdminStatsAction();
  if (!stats) redirect("/dashboard");
  return <AdminOverview stats={stats} />;
}