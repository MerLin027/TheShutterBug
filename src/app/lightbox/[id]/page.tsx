import { notFound, redirect } from "next/navigation";
import { fetchLightbox, normaliseFilter } from "@/lib/data";

/**
 * Old lightbox URLs (Phase R). Photos now open in the gallery's in-page
 * viewer, which is instant; this route only keeps existing /lightbox/<id>
 * links working by sending them there: /work?photo=<id>[&filter=…].
 *
 * It still validates first, so a deleted photo is a real 404 and an
 * outage is the error page — not a gallery that silently opens nothing.
 */
export default async function LightboxRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const filter = normaliseFilter((await searchParams).filter);

  const { photo, failed } = await fetchLightbox(id, filter);
  if (failed) throw new Error("The photograph could not be loaded.");
  if (!photo) notFound();

  // Keep the filter only if the photo is actually in it. A stale filter on
  // an old link (an Urban photo with ?filter=Nature) would otherwise land on
  // a gallery where that photo isn't shown, and the viewer couldn't open.
  const q = new URLSearchParams();
  if (filter !== "All" && photo.category === filter) q.set("filter", filter);
  q.set("photo", photo.id);
  redirect(`/work?${q.toString()}`);
}
