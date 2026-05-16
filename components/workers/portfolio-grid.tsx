"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PortfolioItem {
  id:        string;
  image_url: string;
  caption:   string | null;
}

export function PortfolioGrid({ portfolio }: { portfolio: PortfolioItem[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {portfolio.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item.image_url)}
            className="group relative aspect-video rounded-xl overflow-hidden bg-muted border border-border/40 hover:border-border hover:shadow-soft-sm transition-all"
          >
            <img
              src={item.image_url}
              alt={item.caption ?? "Portfolio"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {item.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox}
            alt="Portfolio"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}