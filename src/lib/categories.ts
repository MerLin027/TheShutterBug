// ---------------------------------------------------------------------------
// categories.ts — the photo category vocabulary, in one place.
//
// These four values are the `enum` on backend/models/Photo.js's `category`
// field. They were previously declared in four files: DashboardClient (with a
// leading "all"), UploadModal, EditModal, and GalleryClient (capitalised, as
// FILTERS). Adding a fifth category meant finding all four.
//
// Lowercase is the storage form — the API filters on it and the DB enum
// rejects anything else. CATEGORY_LABELS is the display form; nothing should
// be capitalising these ad hoc.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "nature",
  "objects",
  "monochrome",
  "urban",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Display form. Keep in step with Photo["category"] in data.ts. */
export const CATEGORY_LABELS: Record<Category, string> = {
  nature: "Nature",
  objects: "Objects",
  monochrome: "Monochrome",
  urban: "Urban",
};

/** Studio's filter dropdown — the four categories plus an "all" sentinel. */
export const STUDIO_FILTERS = ["all", ...CATEGORIES] as const;

/** The public gallery's filter pills, in display form. */
export const GALLERY_FILTERS = [
  "All",
  ...CATEGORIES.map((c) => CATEGORY_LABELS[c]),
] as const;

/** Display label for a raw category string, falling back to the input. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as Category] ?? category;
}
