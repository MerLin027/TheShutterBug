import Link from "next/link";

export default function About() {
  return (
    <div className="bg-primary-container text-on-surface antialiased min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      {/* TopNavBar (Hidden on Mobile, Visible on Desktop) */}
      <header className="hidden md:flex justify-between items-center w-full px-margin-desktop py-6 z-50 fixed top-0 backdrop-blur-xl bg-white/5 border-b border-white/10 flat no-shadows">
        <div className="font-display-lg text-headline-md tracking-tighter text-on-surface">
          The Shutter Bug
        </div>
        <nav className="flex gap-8">
          <Link
            className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md"
            href="/"
          >
            Portfolio
          </Link>
          <Link
            className="text-primary font-medium border-b border-primary pb-1 font-body-md text-body-md scale-95 transition-transform"
            href="/about"
          >
            About
          </Link>
          <Link
            className="text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md"
            href="/contact"
          >
            Contact
          </Link>
        </nav>
        <div>
          <span
            className="material-symbols-outlined text-on-surface cursor-pointer hover:backdrop-blur-2xl hover:bg-white/10 transition-all duration-300 rounded-full p-2"
            data-icon="menu"
          >
            menu
          </span>
        </div>
      </header>

      {/* Main Content: Split Screen */}
      <main className="flex-1 flex flex-col md:flex-row min-h-screen w-full relative">
        {/* Left Side: Large Portrait Image */}
        <div className="w-full md:w-1/2 h-[60vh] md:h-screen relative">
          <img
            alt="Atmospheric black-and-white portrait of the photographer, holding a vintage camera, looking out a window. Natural lighting, deep shadows, cinematic and observant mood."
            className="w-full h-full object-cover grayscale opacity-90 object-[70%_30%]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D"
          />
        </div>
        
        {/* Right Side: Bio Text */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-[#0a0a0a] min-h-[50vh] md:min-h-screen">
          <div className="max-w-xl mx-auto space-y-12">
            <div className="w-12 h-[1px] bg-secondary opacity-70"></div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary-fixed leading-tight">
              Chasing the quiet moments where light meets shadow.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Based in the Nordic Coast, I specialize in cinematic landscapes and minimalist object studies. My work is a meditation on scale, texture, and the passing of time.
            </p>
            <div className="pt-8 flex flex-col gap-4">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                Exhibitions & Features
              </span>
              <ul className="space-y-2 font-body-md text-body-md text-on-surface-variant/80">
                <li>Silence in Motion — Oslo, 2023</li>
                <li>The Monolith Series — Copenhagen, 2022</li>
                <li>Featured in Kinfolk & Cereal Magazine</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Visible on Mobile, Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white/5 backdrop-blur-3xl border border-white/15 rounded-full w-[max-content]">
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:bg-white/10 rounded-full transition-all group"
          href="/"
        >
          <span
            className="material-symbols-outlined mb-1 group-hover:text-primary transition-colors"
            data-icon="grid_view"
          >
            grid_view
          </span>
          <span className="font-label-sm text-label-sm">Gallery</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-6 py-2 scale-90 duration-200"
          href="#"
        >
          <span className="material-symbols-outlined mb-1" data-icon="Collections">
            redeem
          </span>
          <span className="font-label-sm text-label-sm">Series</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2 hover:bg-white/10 rounded-full transition-all group"
          href="#"
        >
          <span
            className="material-symbols-outlined mb-1 group-hover:text-primary transition-colors"
            data-icon="auto_stories"
          >
            auto_stories
          </span>
          <span className="font-label-sm text-label-sm">Journal</span>
        </Link>
      </nav>
    </div>
  );
}
