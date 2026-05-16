"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/workers/filter-sidebar";

interface MobileFilterSheetProps {
  categories: { id: string; name: string; slug: string }[];
}

export function MobileFilterSheet({ categories }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-card overflow-y-auto shadow-soft-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 pt-6">
              <FilterSidebar
                categories={categories}
                isMobile
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}