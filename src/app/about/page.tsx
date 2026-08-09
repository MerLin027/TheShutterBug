import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { fetchSiteContent, splitBio } from "@/lib/data";

// Match / and /work — a Save in Studio calls revalidatePath("/about"), so this
// is only the ceiling on how stale the page can get if that action is missed.
export const revalidate = 60;

export default async function About() {
  const { quote, bio, aboutImageUrl } = await fetchSiteContent();
  const paragraphs = splitBio(bio);

  return (
    <div className="bg-primary-container text-on-surface antialiased min-h-[100dvh] flex flex-col">
      <SiteNav />

      {/* Main Content: Split Screen */}
      <main id="main" className="site-container flex-1 flex flex-col md:flex-row relative pt-32 md:pt-40 px-margin-mobile md:px-margin-desktop gap-12 md:gap-16 pb-section-gap">
        {/* Left: Portrait Image */}
        {/* Nested enclosure: hairline tray (rounded-3xl, 32px) holding the
            image at rounded-2xl (24px), separated by p-1.5. The radii are
            roughly concentric, which is what makes it read as a mounted
            print rather than a cropped rectangle sitting on the page.

            Deliberately applied HERE and nowhere else. The same treatment on
            the gallery and Selected Frames grids would put twenty visible
            trays on screen at once, and context.md's brief is that the UI is
            an invisible frame — one portrait can carry a frame, a wall of
            thumbnails cannot.

            dvh, not vh: on iOS Safari `vh` resolves to the large viewport, so
            this stood taller than the visible area with the URL bar showing
            and then reflowed as it collapsed. */}
        <Reveal className="w-full md:w-1/2" y={0}>
          <div className="photo-surface rounded-3xl bg-white/5 border border-white/10 p-1.5">
            <div className="rounded-2xl overflow-hidden h-[60dvh] md:h-[75dvh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Atmospheric portrait of the photographer at dusk, holding a camera, looking out over the water."
                className="w-full h-full object-cover object-[70%_30%]"
                src={aboutImageUrl}
              />
            </div>
          </div>
        </Reveal>

        {/* Right: Bio Text */}
        <Reveal className="w-full md:w-1/2 flex items-center" delay={0.1} blur>
          <div className="max-w-xl space-y-6">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-accent">
              About
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface leading-tight">
              {quote}
            </h1>
            {/* Paragraph count is whatever the admin saved — space-y-5 keeps
                the vertical rhythm regardless of how many there are. */}
            <div className="space-y-5 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
