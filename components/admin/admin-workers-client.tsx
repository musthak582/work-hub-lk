"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion }  from "framer-motion";
import {
  Search, CheckCircle2, Eye, EyeOff,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { StarDisplay } from "@/components/shared/star-rating";
import { verifyWorkerAction, toggleWorkerActiveAction } from "@/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export function AdminWorkersClient({
  workers, total, page,
}: {
  workers: any[]; total: number; page: number;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [search,  setSearch]  = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch() {
    const params = new URLSearchParams(searchParams.toString());
    search ? params.set("search", search) : params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleVerify(profileId: string) {
    startTransition(async () => {
      const result = await verifyWorkerAction(profileId);
      result.success
        ? toast.success(result.message)
        : toast.error(result.error);
    });
  }

  function handleToggleActive(profileId: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleWorkerActiveAction(profileId, !current);
      result.success
        ? toast.success(result.message)
        : toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-1">Workers</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} worker profiles
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search title or district…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button size="sm" onClick={handleSearch} variant="outline">
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/60 bg-secondary/40">
              <tr>
                {["Worker", "Category", "District", "Rating", "Status", "Joined", "Actions"]
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
              {workers.map((w: any, i) => (
                <motion.tr
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-accent/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(w.user as any)?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {w.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {(w.category as any)?.name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {w.district}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StarDisplay rating={Number(w.avg_rating)} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        ({w.total_reviews})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium w-fit",
                        w.is_active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {w.is_active ? "Active" : "Inactive"}
                      </span>
                      {w.is_verified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium w-fit">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(w.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {!w.is_verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(w.id)}
                          disabled={isPending}
                          className="text-xs h-7 px-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(w.id, w.is_active)}
                        disabled={isPending}
                        className="text-xs h-7 px-2"
                      >
                        {w.is_active
                          ? <><EyeOff className="w-3 h-3 mr-1" />Hide</>
                          : <><Eye    className="w-3 h-3 mr-1" />Show</>
                        }
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

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