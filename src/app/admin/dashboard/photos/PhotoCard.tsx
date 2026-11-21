"use client";

import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Star, Trash2 } from "lucide-react";
import { photoImage, type ApiPhoto } from "@/lib/data";
import { categoryLabel } from "@/lib/categories";

type Props = {
  photo: ApiPhoto;
  onEdit: (photo: ApiPhoto) => void;
  onDelete: (photo: ApiPhoto) => void;
  onToggleFeatured: (photo: ApiPhoto) => void;
};

/**
 * One photo in the Studio grid (Redesign Phase C, task C1).
 *
 * The photograph is never touched: no blur, no darkening, no glass over it.
 * The old card blurred and dimmed the photo under a glass overlay on hover
 * (breaking the project's own "no glass over a photograph" rule) and put a
 * red Delete pill in the middle of it. Its controls only existed on hover,
 * so on a phone they were unreliable at best. REDESIGN.md §3.9 has the old
 * markup.
 *
 * Now: the caption and frame line under the photo, then a tool row, always
 * visible: reorder handle on the left (pointer drag, touch drag, or Space +
 * arrow keys via dnd-kit's keyboard sensor), feature / edit / delete as
 * equal quiet icon buttons on the right. Delete still goes through the confirm
 * dialog — it just no longer dominates the card.
 *
 * The <li> is a `.frame` in the same justified rows as the public gallery,
 * so the order the owner drags here is exactly the order visitors read.
 */
export default function PhotoCard({ photo, onEdit, onDelete, onToggleFeatured }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo._id });

  const ratio = Number.isFinite(photo.aspectRatio) && photo.aspectRatio > 0 ? photo.aspectRatio : 1.5;
  const frame = String((photo.position ?? 0) + 1).padStart(3, "0");
  const name = photo.caption || `${categoryLabel(photo.category)} photograph ${frame}`;

  const style = {
    "--r": ratio,
    // Translate only. rectSortingStrategy also emits a scale to morph one
    // card into another's box; with photos of different shapes that would
    // squash the image mid-drag.
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  } as CSSProperties;

  return (
    <li ref={setNodeRef} style={style} className={`frame ${isDragging ? "opacity-40" : ""}`}>
      <div className="frame-media" style={{ aspectRatio: ratio }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition; no next/image by decision (REDESIGN.md §2) */}
        <img
          src={photoImage(photo, 800)}
          alt={photo.caption || `Untitled ${photo.category} photograph`}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Two lines: the label gets the frame's full width (one shared line
          with four buttons truncated it to "005 · O…" on a narrow frame),
          then the tools — handle left, actions right. */}
      <div className="mt-3 min-w-0">
        {photo.caption && (
          <p className="truncate font-display text-[1.15rem] leading-tight text-fg">{photo.caption}</p>
        )}
        <p className="frame-meta mt-0.5 truncate">
          {frame} · {categoryLabel(photo.category)}
        </p>
      </div>

      <div className="-mx-2 mt-1 flex items-center">
        <button
          type="button"
          className="tool-btn shrink-0 cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Reorder ${name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>

        <span className="flex-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => onToggleFeatured(photo)}
          aria-pressed={photo.isFeatured}
          aria-label={`Feature ${name} in Curated Work`}
          title={photo.isFeatured ? "Featured in Curated Work" : "Feature in Curated Work"}
          className="tool-btn shrink-0"
        >
          <Star size={18} fill={photo.isFeatured ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(photo)}
          aria-label={`Edit ${name}`}
          title="Edit"
          className="tool-btn shrink-0"
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(photo)}
          aria-label={`Delete ${name}`}
          title="Delete"
          className="tool-btn tool-btn-danger shrink-0"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
