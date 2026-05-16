"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion }  from "framer-motion";
import {
  Search, Shield, ShieldOff,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { banUserAction, unbanUserAction } from "@/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminUsersClientProps {
  users: any[];
  total: number;
  page:  number;
}

const PAGE_SIZE = 20;

export function AdminUsersClient({ users, total, page }: AdminUsersClientProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [search,  setSearch]  = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleBan(userId: string, isBanned: boolean) {
    startTransition(async () => {
      const result = isBanned
        ? await unbanUserAction(userId)
        : await banUserAction(userId, "Admin action");

      if (!result.success) { toast.error(result.error); return; }
      toast.success(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Users</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} total users
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams("search", search);
            }}
            placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {["worker", "hirer", ""].map((r) => (
          <button
            key={r || "all"}
            onClick={() => updateParams("role", r)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize",
              (searchParams.get("role") ?? "") === r
                ? "bg-primary text-white border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-accent"
            )}
          >
            {r || "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/60 bg-secondary/40">
              <tr>
                {["User", "Role", "Phone", "Verified", "Status", "Joined", "Actions"]
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
              {users.map((user: any, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-accent/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        user.role === "worker"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : user.role === "hirer"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.role ?? "pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.phone}
                  </td>
                  <td className="px-4 py-3">
                    {user.phone_verified
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle     className="w-4 h-4 text-muted-foreground/40" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full border font-medium",
                      user.is_banned
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    )}>
                      {user.is_banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={user.is_banned ? "outline" : "destructive"}
                      onClick={() => handleBan(user.id, user.is_banned)}
                      disabled={isPending}
                      className="text-xs h-7 px-2.5"
                    >
                      {user.is_banned
                        ? <><Shield    className="w-3 h-3 mr-1" />Unban</>
                        : <><ShieldOff className="w-3 h-3 mr-1" />Ban</>
                      }
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}