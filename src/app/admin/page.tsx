import SignInClient, { type SignInPhoto } from "./SignInClient";

/**
 * Studio sign-in. One fixed photograph beside the form (owner's choice,
 * 2026-11-15: "an aesthetic image of the northern lights"; swapped from Reine
 * to Flakstad the same day — "too bright, not enough aurora"), so it no longer
 * depends on which gallery photos are featured — and the page no longer
 * waits on the backend at all.
 *
 * Unsplash License: free to use, commercial included, no permission needed.
 * Credit is shown anyway. Served from Unsplash's image CDN (their hotlinking
 * is the intended use); `auto=format` gives WebP/AVIF to browsers that ask.
 */
const BASE = "https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?ixlib=rb-4.1.0&auto=format&fit=crop&q=80";

const PHOTO: SignInPhoto = {
  src: `${BASE}&w=1600`,
  srcSet: [800, 1200, 1600, 2400].map((w) => `${BASE}&w=${w} ${w}w`).join(", "),
  alt: "Green northern lights filling the night sky over snowy mountains, mirrored on a calm beach at Flakstad, Lofoten",
  title: "Flakstad, Lofoten",
  credit: {
    name: "Johny Goerend",
    url: "https://unsplash.com/photos/northern-lights-over-flakstad-beach-U_diPCXCBxU",
  },
};

export default function AdminLoginPage() {
  return <SignInClient photo={PHOTO} />;
}
