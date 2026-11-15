import { fetchFeaturedPhotos } from "@/lib/data";
import SignInClient, { type SignInPhoto } from "./SignInClient";

/**
 * Studio sign-in. A server shell so the page can show one of the owner's
 * featured photographs beside the form (Studio refinement, 2026-11-15); the
 * session check and the form itself are client-side in SignInClient.
 *
 * Only public data crosses to the client — the same photo the home page
 * already shows — and only the four fields the page renders.
 */
export default async function AdminLoginPage() {
  const { photos } = await fetchFeaturedPhotos(1);
  const first = photos[0];
  const photo: SignInPhoto | null = first
    ? { src: first.src, srcSet: first.srcSet, alt: first.alt, title: first.title }
    : null;

  return <SignInClient photo={photo} />;
}
