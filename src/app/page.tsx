import Link from "next/link";
import AdminNavLink from "@/components/AdminNavLink";

export default function Home() {
  return (
    <div className="text-on-surface antialiased bg-[#0A0A0A]">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full px-margin-mobile md:px-margin-desktop pointer-events-none">
        <div className="pointer-events-auto bg-white/10 backdrop-blur-[20px] rounded-full mt-8 mx-auto w-fit px-8 py-3 border-t border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-between gap-8 md:gap-16">
          <Link
            className="font-headline-md text-headline-md tracking-tighter text-on-surface hover:text-primary transition-colors"
            href="/"
          >
            THE SHUTTER BUG
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link className="font-label-sm text-label-sm tracking-widest text-primary font-bold" href="/work">
              Gallery
            </Link>
            <Link
              className="font-label-sm text-label-sm tracking-widest text-on-surface/70 hover:text-on-surface hover:bg-white/20 transition-all duration-300 rounded-full px-3 py-1"
              href="/about"
            >
              About
            </Link>
            <Link
              className="font-label-sm text-label-sm tracking-widest text-on-surface/70 hover:text-on-surface hover:bg-white/20 transition-all duration-300 rounded-full px-3 py-1"
              href="/contact"
            >
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <AdminNavLink className="text-on-surface hover:text-primary transition-colors flex items-center justify-center hover:bg-white/20 rounded-full p-2 scale-105 active:scale-95 transition-transform" />
            <button
              aria-label="grid_view"
              className="text-on-surface hover:text-primary transition-colors flex items-center justify-center hover:bg-white/20 rounded-full p-2 scale-105 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined" data-icon="grid_view">
                grid_view
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            alt="Hero Background"
            className="w-full h-full object-cover opacity-80"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/30 to-[#0a0a0a]"></div>
        </div>
        <div className="relative z-10 text-center px-4 mix-blend-overlay">
          <h1 className="font-display-lg text-display-lg text-white opacity-90 tracking-tighter mix-blend-plus-lighter">
            THE SHUTTER BUG
          </h1>
        </div>
      </header>

      {/* Gallery Section */}
      <main className="w-full px-margin-mobile md:px-margin-desktop py-section-gap">
        <div className="masonry-grid">
          <div className="masonry-item">
            <div className="photo-card relative rounded-lg overflow-hidden glass-edge group cursor-pointer bg-surface/50">
              <img
                className="w-full h-auto object-cover aspect-[3/4]"
                data-alt="A striking digital installation art piece featuring glowing, generative geometric shapes suspended in a vast, minimalist gallery space. The room is illuminated by high-key, soft white lighting that creates a bright, modern light-mode aesthetic. The artwork relies on a sophisticated palette of deep blacks and pristine whites, punctuated by intense accents of vibrant red. The mood is serene yet technologically advanced."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHQgBGXgkuLgyan__B3YASlg4AUfvBUvn44xlFzz2cMfMX0GeqfDne9yrm5UGrMOqYQacVSjGFXVMODEOQ9YNhPVLHh020XjvdcXI-qg259jfrCCZhLymc268ZisIQ-Ol1vWR9jBCPMqvsvrKqn5dhAmNopUS5hs5ULd1eVF3nt8xxJcuvz8_oaX3D3Bg96iy8cVIYDlxpNvku685ldnnDntYNvq3igKA9rkHM3MySpT8sjGnLs3bS"
              />
              <div className="photo-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="font-label-sm text-label-sm text-primary tracking-widest mb-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit">
                  2024
                </span>
                <h3 className="font-body-lg text-body-lg text-on-surface">Urban Silence</h3>
              </div>
            </div>
          </div>
          <div className="masonry-item">
            <div className="photo-card relative rounded-lg overflow-hidden glass-edge group cursor-pointer bg-surface/50">
              <img
                className="w-full h-auto object-cover aspect-video"
                data-alt="A striking digital installation art piece featuring glowing, generative geometric shapes suspended in a vast, minimalist gallery space. The room is illuminated by high-key, soft white lighting that creates a bright, modern light-mode aesthetic. The artwork relies on a sophisticated palette of deep blacks and pristine whites, punctuated by intense accents of vibrant red. The mood is serene yet technologically advanced."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgAC60DKJ4tOZlRWj-vRon1I72QOjRFauxfxBIhdAlroi6WjjBWLcoOZXC-AlBKjCLAqLEapCaJCJLH68jJJnMVbXXuz_R-iO86qv_b5A-hcRI5Mloc--oYX4GXL5lVzMcwNkFUD5ayX_FFl41kOVTjPGTrcoMlepPKKLfuo9T1_nMJsGf3WvvcflOcN7loQYu-fqPiRPnf94QlHVtvKrJt-4Hmw9-RWXab6f86vlo-Lr3l2s33Xby"
              />
              <div className="photo-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="font-label-sm text-label-sm text-primary tracking-widest mb-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit">
                  2023
                </span>
                <h3 className="font-body-lg text-body-lg text-on-surface">Nordic Coast</h3>
              </div>
            </div>
          </div>
          <div className="masonry-item">
            <div className="photo-card relative rounded-lg overflow-hidden glass-edge group cursor-pointer bg-surface/50">
              <img
                className="w-full h-auto object-cover aspect-square"
                data-alt="A striking digital installation art piece featuring glowing, generative geometric shapes suspended in a vast, minimalist gallery space. The room is illuminated by high-key, soft white lighting that creates a bright, modern light-mode aesthetic. The artwork relies on a sophisticated palette of deep blacks and pristine whites, punctuated by intense accents of vibrant red. The mood is serene yet technologically advanced."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT0_w77T7y30_fqNaiG4_izGva69EswbKYM65r9jE1XLcHekJv9It3bslzW6oEtyqTPRFkmZB16aZqTi1-RW4sEVSJnNhyqL7IBJ378_rWgaGMv8X_6IM1cy-mjWZjDOWjTRQBCNNyzayOCt_8eIh_TtpXcJyDkGu7IpIeyU-SYjCdImr-1uBhJJ9CJrPfYm7Cxcq2MCVeUMDjsnSBSHumRUV8IQSFGbcJEw8oCQknQW4noMtyBp3G"
              />
              <div className="photo-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="font-label-sm text-label-sm text-primary tracking-widest mb-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit">
                  2024
                </span>
                <h3 className="font-body-lg text-body-lg text-on-surface">Texture Study I</h3>
              </div>
            </div>
          </div>
          <div className="masonry-item">
            <div className="photo-card relative rounded-lg overflow-hidden glass-edge group cursor-pointer bg-surface/50">
              <img
                className="w-full h-auto object-cover aspect-[4/5]"
                data-alt="A striking digital installation art piece featuring glowing, generative geometric shapes suspended in a vast, minimalist gallery space. The room is illuminated by high-key, soft white lighting that creates a bright, modern light-mode aesthetic. The artwork relies on a sophisticated palette of deep blacks and pristine whites, punctuated by intense accents of vibrant red. The mood is serene yet technologically advanced."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_wY8CGmww7h8FZeri5LEfTsLniUP0QAiFdiUqF2qZjn1uAjrnfdv6VfBK9g4-Z3ndJmxyyfLLoClE2PVCN9PNitRCSl498hx6rDGLdQlofv7YAhBTGmsPfjX2KJ1c3xrW6a9lBbnZKvcjGYCPsPCW6DLmrCPBmngIl7W7Hr-kegBERzufZA0zL2il9J6uOugquScNwhFWu4idUTMyvBDoIdxcNnwLpNiAWoqDlpp8GLlb_uHodr_S"
              />
              <div className="photo-overlay absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="font-label-sm text-label-sm text-primary tracking-widest mb-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit">
                  2022
                </span>
                <h3 className="font-body-lg text-body-lg text-on-surface">Midnight Chrome</h3>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent full-width py-section-gap no-border flex flex-col items-center justify-center gap-element-gap w-full px-margin-desktop pb-[120px]">
        <div className="font-headline-md text-headline-md text-on-surface mb-4">THE SHUTTER BUG</div>
        <div className="flex gap-8 mb-8">
          <Link
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
            href="#"
          >
            Instagram
          </Link>
          <Link
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
            href="#"
          >
            Twitter
          </Link>
          <Link
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
            href="#"
          >
            LinkedIn
          </Link>
        </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant/50">
          © 2024 The Shutter Bug. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
