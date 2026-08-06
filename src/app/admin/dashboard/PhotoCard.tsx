"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ApiPhoto } from "@/lib/data";

type Props = {
  photo: ApiPhoto;
  onEdit: (photo: ApiPhoto) => void;
  onDelete: (photo: ApiPhoto) => void;
  onToggleFeatured: (photo: ApiPhoto) => void;
};

export default function PhotoCard({
  photo,
  onEdit,
  onDelete,
  onToggleFeatured,
}: Props) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden break-inside-avoid bg-surface-container liquid-hover border border-white/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.caption || "Portfolio Image"}
        className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:blur-[2px] group-hover:brightness-75"
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

      {/* Liquid Glass Overlay (Hover) — three actions: Edit, Delete, Featured */}
      <div className="glass-overlay absolute inset-0 flex flex-col justify-between p-4 z-20 pointer-events-none group-hover:pointer-events-auto">
        {/* Secondary actions — top right */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onToggleFeatured(photo)}
            title={photo.isFeatured ? "Remove from Selected Frames" : "Add to Selected Frames"}
            className={`p-2 rounded-full backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] ${
              photo.isFeatured
                ? "bg-accent/90 text-[#1c1b1b]"
                : "bg-black/60 hover:bg-black/80 text-white"
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: `'FILL' ${photo.isFeatured ? 1 : 0}` }}
            >
              star
            </span>
          </button>
          <button
            onClick={() => onEdit(photo)}
            title="Edit"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {/* Prominent Delete — centered, matching the reference */}
        <button
          onClick={() => onDelete(photo)}
          className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-error-container/90 hover:bg-error-container text-on-error-container backdrop-blur-md transition-colors font-label-sm text-label-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[16px]">
            delete
          </span>
          Delete
        </button>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-bold text-white">
              {photo.caption || photo.category}
            </span>
            <span className="font-label-sm text-label-sm text-white/70 uppercase tracking-widest mt-0.5">
              {photo.category}
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
