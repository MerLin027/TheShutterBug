"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ApiPhoto } from "@/lib/data";

type Props = {
  photo: ApiPhoto;
  onEdit: (photo: ApiPhoto) => void;
  onDelete: (photo: ApiPhoto) => void;
};

export default function PhotoCard({ photo, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  /** Format file size hint from the category (decorative, per reference). */
  const categoryCode = photo.category.toUpperCase().slice(0, 4);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden break-inside-avoid bg-surface-container liquid-hover image-scale-hover border border-white/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.caption || "Portfolio Image"}
        className="w-full h-auto object-cover"
        src={photo.imageUrl}
      />

      {/* Permanent Drag Handle — top-left (from reference) */}
      <div
        className="absolute top-3 left-3 p-1.5 rounded-md bg-black/40 backdrop-blur-md text-white/70 border border-white/10 z-10 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="material-symbols-outlined text-[18px]">
          drag_indicator
        </span>
      </div>

      {/* Liquid Glass Overlay (Hover) — from reference */}
      <div className="glass-overlay absolute inset-0 flex flex-col justify-between p-4 z-20 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(photo)}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => onDelete(photo)}
            className="p-2 rounded-full bg-error/20 hover:bg-error/40 text-error backdrop-blur-md transition-colors border border-error/30"
          >
            <span className="material-symbols-outlined text-[18px]">
              delete
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-white uppercase tracking-widest">
              {photo.caption || photo.category}
            </span>
            <span className="text-xs text-white/60 font-mono mt-1">
              {categoryCode}_{String(photo.position).padStart(2, "0")}
            </span>
          </div>
          <div
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-lg cursor-grab active:cursor-grabbing transition-colors"
            {...attributes}
            {...listeners}
          >
            <span className="material-symbols-outlined">drag_pan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
