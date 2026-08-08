import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";

export default function About() {
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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D"
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
              Chasing light, quietly.
            </h1>
            <div className="space-y-5 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              <p>
                I am a photographer working mostly at the edges of the day —
                the hour before the sun clears the horizon, and the long blue
                minutes after it drops behind it.
              </p>
              <p>
                My work is about absence as much as presence: an empty
                platform, a road with nobody on it, one boat holding the
                centre of an enormous stretch of water. When people appear in
                a frame, they are weather, not subject.
              </p>
              <p>
                I shoot on a mix of digital and film, print small, and travel
                light. The Shutter Bug is where the work collects.
              </p>
            </div>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
