/**
 * The sign-in page's photographs: one is shown per visit, a different one on
 * each refresh (owner's request, 2026-11-15: northern lights, Edinburgh,
 * Norway, F1, space, nature — "high quality ones").
 *
 * All from Unsplash under the Unsplash License (free to use, commercial
 * included, no permission needed); every one was checked non-premium and
 * its credit read from Unsplash's own photo data. Credit is shown anyway.
 * Chosen for low-key, moody tones that sit beside the dark form.
 *
 * Served from Unsplash's image CDN (hotlinking is their intended use):
 * high quality (q=85), widths up to 3000 for large high-DPI screens, and
 * `auto=format` for WebP/AVIF where the browser accepts it.
 */
export type SignInPhoto = {
  src: string;
  srcSet: string;
  alt: string;
  /** Short caption: where or what. */
  title: string;
  /** Photographer credit for a photo that isn't the owner's own. */
  credit?: { name: string; url: string };
};

const WIDTHS = [960, 1400, 1800, 2400, 3000];

function unsplash(
  id: string,
  title: string,
  alt: string,
  name: string,
  page: string
): SignInPhoto {
  const base = `https://images.unsplash.com/${id}?ixlib=rb-4.1.0&auto=format&fit=crop&q=85`;
  return {
    src: `${base}&w=1800`,
    srcSet: WIDTHS.map((w) => `${base}&w=${w} ${w}w`).join(", "),
    alt,
    title,
    credit: { name, url: page },
  };
}

export const SIGN_IN_PHOTOS: SignInPhoto[] = [
  unsplash(
    "photo-1507272931001-fc06c17e4f43",
    "Flakstad, Lofoten",
    "Green northern lights filling the night sky over snowy mountains, mirrored on a calm beach at Flakstad, Lofoten",
    "Johny Goerend",
    "https://unsplash.com/photos/northern-lights-over-flakstad-beach-U_diPCXCBxU"
  ),
  unsplash(
    "photo-1528155124528-06c125d81e89",
    "Ylläsjärvi, Finland",
    "Green northern lights swirling above a line of pine trees at night",
    "Lucas Marcomini",
    "https://unsplash.com/photos/northern-light-at-night-cVBz9q1T_9M"
  ),
  unsplash(
    "photo-1594800083755-8fe31b2c99df",
    "Victoria Street, Edinburgh",
    "A cobblestone street lined with colourful shopfronts in Edinburgh at dusk, wet stones reflecting the lights",
    "jim Divine",
    "https://unsplash.com/photos/cobblestone-street-in-edinburgh-at-dusk-qpQ7NQ2CXA4"
  ),
  unsplash(
    "photo-1668509549273-14abf4067904",
    "Edinburgh",
    "The Edinburgh skyline and castle in silhouette against a hazy sunset",
    "Natalie Parham",
    "https://unsplash.com/photos/a-city-with-a-sunset-DqWQX31FUXQ"
  ),
  unsplash(
    "photo-1705512604302-3dc9d171832c",
    "Fjord, Norway",
    "A ship crossing a dark fjord between steep, cloud-capped cliffs in Norway",
    "David Bottenberg",
    "https://unsplash.com/photos/a-boat-in-a-body-of-water-surrounded-by-mountains-VQv1N3FOsRg"
  ),
  unsplash(
    "photo-1779885529717-952eb9a81849",
    "Race circuit at sunset",
    "A winding race circuit seen from above at sunset, cars on track and spectators along the barriers",
    "Baptiste Prat",
    "https://unsplash.com/photos/sunset-over-a-race-track-with-cars-and-spectators-IkQ-d_zDH6g"
  ),
  unsplash(
    "photo-1775647733227-81681766ff4e",
    "Formula 1",
    "Front view of a vintage red-and-white Formula 1 car against a dark background",
    "Namito Yokota",
    "https://unsplash.com/photos/front-view-of-a-vintage-formula-1-race-car-7jGWpxW_klY"
  ),
  unsplash(
    "photo-1533683083439-1a776a5653cb",
    "Milky Way",
    "The Milky Way rising over a dark tree line, reflected in still water",
    "Thomas Ciszewski",
    "https://unsplash.com/photos/photograph-of-milky-way-over-body-of-water-JnY_xqJE230"
  ),
  unsplash(
    "photo-1501862700950-18382cd41497",
    "Under the Milky Way",
    "The Milky Way arching over eroded rock formations under a starry sky",
    "John Fowler",
    "https://unsplash.com/photos/brown-mountain-under-starry-sky-7Ym9rpYtSdA"
  ),
  unsplash(
    "photo-1677088359746-9213fd17a17d",
    "Pine forest in fog",
    "Dark pine trees on a slope, half hidden by drifting fog",
    "Liliia Liliia",
    "https://unsplash.com/photos/a-forest-filled-with-lots-of-trees-covered-in-fog-7b_AicO5BxY"
  ),
];
