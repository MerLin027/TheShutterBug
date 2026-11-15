import SignInClient, { type SignInPhoto } from "./SignInClient";

/**
 * Studio sign-in. One fixed photograph beside the form (owner's choice,
 * 2026-11-15: "an aesthetic image of the northern lights"), so it no longer
 * depends on which gallery photos are featured — and the page no longer
 * waits on the backend at all.
 *
 * Unsplash License: free to use, commercial included, no permission needed.
 * Credit is shown anyway. Served from Unsplash's image CDN (their hotlinking
 * is the intended use); `auto=format` gives WebP/AVIF to browsers that ask.
 */
const BASE = "https://images.unsplash.com/photo-1593378026483-2a1fd46a35bd?ixlib=rb-4.1.0&auto=format&fit=crop&q=80";

const PHOTO: SignInPhoto = {
  src: `${BASE}&w=1600`,
  srcSet: [800, 1200, 1600, 2400].map((w) => `${BASE}&w=${w} ${w}w`).join(", "),
  alt: "Green aurora borealis above the snowy mountains and coastal village of Reine, Lofoten",
  title: "Reine, Lofoten",
  credit: {
    name: "Johny Goerend",
    url: "https://unsplash.com/photos/aurora-borealis-over-reine-lofoten-x3WQMj5QkEE",
  },
};

export default function AdminLoginPage() {
  return <SignInClient photo={PHOTO} />;
}
