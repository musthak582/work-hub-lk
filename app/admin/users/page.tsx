import { getAdminUsersAction } from "@/actions/admin";
import { AdminUsersClient }    from "@/components/admin/admin-users-client";

export const metadata = { title: "Users — Admin" };

interface Props {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp     = await searchParams;
  const page   = Number(sp.page ?? 1);
  const search = sp.search ?? "";
  const role   = sp.role   ?? "";

  const { users, total } = await getAdminUsersAction(page, search, role);

  return <AdminUsersClient users={users} total={total} page={page} />;
}