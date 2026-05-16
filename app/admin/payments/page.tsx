import { getAdminPaymentsAction } from "@/actions/admin";
import { formatDistanceToNow }    from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn }    from "@/lib/utils";

export const metadata = { title: "Payments — Admin" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const sp   = await searchParams;
  const page = Number(sp.page ?? 1);
  const { payments, total } = await getAdminPaymentsAction(page);

  const STATUS_STYLES: Record<string, string> = {
    completed: "bg-green-50 text-green-700 border-green-200",
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    failed:    "bg-red-50   text-red-700   border-red-200",
    refunded:  "bg-blue-50  text-blue-700  border-blue-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Payments</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} total payment records
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/60 bg-secondary/40">
              <tr>
                {["User", "Type", "Amount", "Order ID", "Status", "Date"]
                  .map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {(p.user as any)?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(p.user as any)?.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {p.payment_type.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    LKR {Number(p.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
                      {p.payhere_order_id?.slice(-12) ?? "—"}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                      STATUS_STYLES[p.status] ?? ""
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}