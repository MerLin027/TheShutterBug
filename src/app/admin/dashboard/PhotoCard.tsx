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
      className="relative group rounded-2xl overflow-hidden break-inside-avoid bg-surface-container liquid-hover border border-white/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.caption || `Untitled ${photo.category} photograph`}
        className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.03] group-hover:blur-[2px] group-hover:brightness-75"
        src={photo.imageUrl}
      />

      {/* Liquid Glass Overlay (Hover) — four controls: Reorder, Featured,
          Edit, Delete.

          The reorder handle used to be a fifth element outside this overlay:
          a dark square pinned top-left of the card, painted at all times
          while every other control waited for hover, so a grid at rest was a
          grid of photographs each with a widget stuck on it. It is the same
          handle with the same dnd-kit listeners, moved inside the overlay and
          into the same circular glass shape as its neighbours. Reordering is
          untouched — drag still starts from the handle, at the same corner.

          There were also *two* handles bound to one sortable: this one and a
          second `drag_pan` circle in the bottom-right of the overlay. They
          were never visible at the same time (the overlay covered the square
          one on hover), and spreading dnd-kit's `attributes` across two
          elements gave one sortable item two focusable roles. One handle
          now. */}
      <div className="glass-overlay absolute inset-0 flex flex-col justify-between p-4 z-20 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
        {/* Reorder handle left, secondary actions right */}
        <div className="flex justify-between gap-2">
          <div
            className="btn-icon-glass text-white cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <span className="material-symbols-outlined text-[18px]">
              drag_indicator
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleFeatured(photo)}
              title={photo.isFeatured ? "Remove from Selected Frames" : "Add to Selected Frames"}
              className={`btn-icon-glass ${
                photo.isFeatured ? "btn-icon-glass-on" : "text-white"
              }`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{
                  fontVariationSettings: `'FILL' ${photo.isFeatured ? 1 : 0}, 'wght' 250`,
                }}
              >
                star
              </span>
            </button>
            <button
              onClick={() => onEdit(photo)}
              title="Edit"
              className="btn-icon-glass text-white"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        </div>

        {/* Prominent Delete — centered, matching the reference */}
        <button
          onClick={() => onDelete(photo)}
          className="btn-danger mx-auto flex items-center gap-2 px-5 py-2.5 font-label-sm text-label-sm uppercase tracking-widest"
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
        </div>
      </div>
    </div>
  );
}
