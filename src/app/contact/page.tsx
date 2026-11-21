import { fetchFeaturedPhotos, fetchPhotos } from "@/lib/data";
import ContactClient from "./ContactClient";

// Same window as the other public pages; a Studio change revalidates it.
export const revalidate = 60;

/**
 * Contact. Server-rendered so the page can show one of the owner's
 * photographs beside the form: the first Selected Work photo, else the first
 * in the gallery, else none (the form stands alone). Fetch failures simply
 * mean no photograph.
 */
export default async function Contact() {
  const featured = await fetchFeaturedPhotos(1);
  const photo = featured.photos[0] ?? (await fetchPhotos()).photos[0] ?? null;
  return <ContactClient photo={photo} />;
}
