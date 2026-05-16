import { getAdminWorkersAction } from "@/actions/admin";
import { AdminWorkersClient }    from "@/components/admin/admin-workers-client";

export const metadata = { title: "Workers — Admin" };

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminWorkersPage({ searchParams }: Props) {
  const sp   = await searchParams;
  const page = Number(sp.page ?? 1);
  const { workers, total } = await getAdminWorkersAction(
    page, sp.search ?? ""
  );
  return <AdminWorkersClient workers={workers} total={total} page={page} />;
}