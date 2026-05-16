"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition }    from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { cn }     from "@/lib/utils";
import { SRI_LANKA_DISTRICTS } from "@/schemas/worker";

interface Category {
  id:   string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: Category[];
  isMobile?:  boolean;
  onClose?:   () => void;
}

const SORT_OPTIONS = [
  { value: "rating",     label: "Highest rated"   },
  { value: "newest",     label: "Newest first"     },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const RATING_OPTIONS = [
  { value: "4", label: "4★ & above" },
  { value: "3", label: "3★ & above" },
  { value: "2", label: "2★ & above" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available",   label: "Available now" },
  { value: "busy",        label: "Busy"          },
];

function FilterSection({
  title, children, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function FilterSidebar({ categories, isMobile, onClose }: FilterSidebarProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read current params
  const currentCategory     = searchParams.get("category")     ?? "";
  const currentDistrict     = searchParams.get("district")     ?? "";
  const currentSort         = searchParams.get("sort")         ?? "rating";
  const currentAvailability = searchParams.get("availability") ?? "";
  const currentMinRating    = searchParams.get("min_rating")   ?? "";
  const currentMinPrice     = searchParams.get("min_price")    ?? "";
  const currentMaxPrice     = searchParams.get("max_price")    ?? "";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  function clearAll() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
    onClose?.();
  }

  // Count active filters
  const activeCount = [
    currentCategory, currentDistrict, currentAvailability,
    currentMinRating, currentMinPrice, currentMaxPrice,
  ].filter(Boolean).length;

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border/60 shadow-soft p-5",
      isMobile && "rounded-none border-0 shadow-none"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && (
            <Badge className="text-xs h-5 px-1.5 bg-primary text-white">
              {activeCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SORT */}
      <FilterSection title="Sort by">
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam("sort", opt.value)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                currentSort === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* CATEGORY */}
      <FilterSection title="Category">
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                updateParam("category", currentCategory === cat.slug ? null : cat.slug)
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentCategory === cat.slug
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* DISTRICT */}
      <FilterSection title="District" defaultOpen={false}>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {SRI_LANKA_DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => updateParam("district", currentDistrict === d ? null : d)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentDistrict === d
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* AVAILABILITY */}
      <FilterSection title="Availability">
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateParam(
                  "availability",
                  currentAvailability === opt.value ? null : opt.value
                )
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentAvailability === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* MIN RATING */}
      <FilterSection title="Minimum rating">
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() =>
                updateParam(
                  "min_rating",
                  currentMinRating === opt.value ? null : opt.value
                )
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                currentMinRating === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* PRICE RANGE */}
      <FilterSection title="Price range (LKR)" defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min</label>
              <input
                type="number"
                placeholder="0"
                min={0}
                defaultValue={currentMinPrice}
                onBlur={(e) =>
                  updateParam("min_price", e.target.value || null)
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max</label>
              <input
                type="number"
                placeholder="Any"
                min={0}
                defaultValue={currentMaxPrice}
                onBlur={(e) =>
                  updateParam("max_price", e.target.value || null)
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Under 5K",  min: "",    max: "5000"  },
              { label: "5K–15K",    min: "5000", max: "15000" },
              { label: "15K+",      min: "15000", max: ""    },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  updateParam("min_price", preset.min || null);
                  updateParam("max_price", preset.max || null);
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>
    </div>
  );
}