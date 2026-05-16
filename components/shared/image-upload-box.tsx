"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadBoxProps {
  label:        string;
  preview:      string | null;
  onSelect:     (dataUrl: string) => void;
  onRemove:     () => void;
  aspectRatio?: "square" | "landscape";
  maxSizeMB?:   number;
}

export function ImageUploadBox({
  label, preview, onSelect, onRemove,
  aspectRatio = "square",
  maxSizeMB = 5,
}: ImageUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") onSelect(reader.result);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors",
        aspectRatio === "square" ? "aspect-square" : "aspect-video"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <>
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-xs font-medium">Change photo</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors p-2">
          <Upload className="w-5 h-5" />
          <p className="text-xs text-center leading-tight">{label}</p>
        </div>
      )}
    </div>
  );
}