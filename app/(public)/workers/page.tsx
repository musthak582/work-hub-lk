import { Suspense }  from "react";
import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { searchWorkersAction, getCategoriesAction } from "@/actions/search";
import { WorkerCard }        from "@/components/workers/worker-card";
import { WorkerGridSkeleton } from "@/components/workers/worker-card-skeleton";
import { FilterSidebar }     from "@/components/workers/filter-sidebar";
import { WorkersSearchBar }  from "@/components/workers/workers-search-bar";
import { Pagination }        from "@/components/workers/pagination";
import { MobileFilterSheet } from "@/components/workers/mobile-filter-sheet";
import type { SearchParams } from "@/actions/search";

export const metadata: Metadata = {
  title:       "Find Skilled Workers in Sri Lanka",
  description: "Browse verified electricians, plumbers, carpenters, tutors and more across all districts.",
};

interface WorkersPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function WorkersPage({ searchParams }: WorkersPageProps) {
  const sp = await searchParams;

  const params: SearchParams = {
    q:            sp.q          ?? undefined,
    category:     sp.category   ?? undefined,
    district:     sp.district   ?? undefined,
    availability: sp.availability ?? undefined,
    min_price:    sp.min_price  ? Number(sp.min_price)  : undefined,
    max_price:    sp.max_price  ? Number(sp.max_price)  : undefined,
    min_rating:   sp.min_rating ? Number(sp.min_rating) : undefined,
    sort:         (sp.sort as SearchParams["sort"]) ?? "rating",
    page:         sp.page       ? Number(sp.page)       : 1,
  };

  const [{ workers, total, page, totalPages, hasNext, hasPrev }, categories] =
    await Promise.all([
      searchWorkersAction(params),
      getCategoriesAction(),
    ]);

  const hasActiveFilters = !!(
    params.q || params.category || params.district ||
    params.availability || params.min_rating ||
    params.min_price || params.max_price
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-secondary/40 border-b border-border/40 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Find skilled workers
          </h1>
          <p className="text-muted-foreground text-sm mb-5">
            {total > 0
              ? `${total.toLocaleString()} worker${total !== 1 ? "s" : ""} found${params.q ? ` for "${params.q}"` : ""}`
              : "No workers found — try adjusting your filters"
            }
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xl">
              <Suspense>
                <WorkersSearchBar />
              </Suspense>
            </div>
            {/* Mobile filter button */}
            <Suspense>
              <MobileFilterSheet categories={categories} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          {/* Filter sidebar — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Suspense>
                <FilterSidebar categories={categories} />
              </Suspense>
            </div>
          </aside>

          {/* Worker grid */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {hasActiveFilters && (
              <ActiveFilterChips params={params} categories={categories} />
            )}

            {workers.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {workers.map((worker) => (
                    <WorkerCard key={worker.id} worker={worker} />
                  ))}
                </div>

                <Suspense>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                  />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTIVE FILTER CHIPS
// ============================================
function ActiveFilterChips({
  params, categories,
}: {
  params: SearchParams;
  categories: { name: string; slug: string }[];
}) {
  const chips: { label: string; key: string }[] = [];
  if (params.q)            chips.push({ label: `"${params.q}"`,   key: "q"           });
  if (params.district)     chips.push({ label: params.district,    key: "district"    });
  if (params.availability) chips.push({ label: params.availability, key: "availability" });
  if (params.min_rating)   chips.push({ label: `${params.min_rating}★+`, key: "min_rating" });
  if (params.category) {
    const cat = categories.find((c) => c.slug === params.category);
    if (cat) chips.push({ label: cat.name, key: "category" });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
        <SlidersHorizontal className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters ? "No workers match your filters" : "No workers yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {hasFilters
          ? "Try removing some filters or broadening your search to find more workers."
          : "Be the first to create a worker profile on WorkHub LK!"
        }
      </p>
    </div>
  );
}