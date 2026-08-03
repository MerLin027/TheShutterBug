import Link from "next/link";

export default function Contact() {
  return (
    <div className="bg-primary-container text-on-surface min-h-screen flex flex-col relative overflow-x-hidden selection:bg-tertiary selection:text-on-tertiary">
      <div className="noise-overlay"></div>
      
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full mt-6 px-margin-mobile md:px-margin-desktop pointer-events-none">
        <nav className="bg-white/10 backdrop-blur-[30px] rounded-full mx-auto w-fit px-8 py-3 border-[0.5px] border-white/15 flex items-center gap-8 pointer-events-auto shadow-none">
          <Link
            className="font-headline-md text-headline-md tracking-tighter text-on-surface hover:text-primary transition-colors"
            href="/"
          >
            The Shutter Bug
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              className="font-label-sm text-label-sm tracking-widest text-on-surface/70 hover:bg-white/20 transition-all duration-300 px-3 py-1.5 rounded-full"
              href="/"
            >
              Work
            </Link>
            <Link
              className="font-label-sm text-label-sm tracking-widest text-on-surface/70 hover:bg-white/20 transition-all duration-300 px-3 py-1.5 rounded-full"
              href="/about"
            >
              About
            </Link>
            <Link
              className="font-label-sm text-label-sm tracking-widest text-primary font-bold hover:bg-white/20 transition-all duration-300 px-3 py-1.5 rounded-full scale-105 active:scale-95 transition-transform"
              href="/contact"
            >
              Contact
            </Link>
          </div>
          <button className="text-on-surface hover:bg-white/20 p-2 rounded-full transition-all duration-300 flex items-center justify-center scale-105 active:scale-95">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              grid_view
            </span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop pt-32 pb-section-gap relative z-10 w-full max-w-3xl mx-auto">
        <div className="text-center mb-16 space-y-6 animate-[fadeInUp_1s_ease-out]">
          <h1 className="font-display-lg text-display-lg text-on-surface">
            Get in Touch
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Inquiries regarding commissions, licensing, or gallery exhibitions. We review all submissions within two business days.
          </p>
        </div>
        <form className="w-full space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="relative group">
              <label
                className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1"
                htmlFor="name"
              >
                Name
              </label>
              <input
                className="w-full bg-transparent border-0 liquid-glass-input font-body-md text-body-md text-on-surface px-4 py-3 focus:ring-0 placeholder:text-on-surface-variant/50"
                id="name"
                name="name"
                placeholder="Jane Doe"
                type="text"
              />
            </div>
            <div className="relative group">
              <label
                className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="w-full bg-transparent border-0 liquid-glass-input font-body-md text-body-md text-on-surface px-4 py-3 focus:ring-0 placeholder:text-on-surface-variant/50"
                id="email"
                name="email"
                placeholder="jane@example.com"
                type="email"
              />
            </div>
          </div>
          <div className="relative group">
            <label
              className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1"
              htmlFor="subject"
            >
              Subject
            </label>
            <input
              className="w-full bg-transparent border-0 liquid-glass-input font-body-md text-body-md text-on-surface px-4 py-3 focus:ring-0 placeholder:text-on-surface-variant/50"
              id="subject"
              name="subject"
              placeholder="Commission Inquiry"
              type="text"
            />
          </div>
          <div className="relative group">
            <label
              className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1"
              htmlFor="message"
            >
              Message
            </label>
            <textarea
              className="w-full bg-transparent border-0 liquid-glass-input font-body-md text-body-md text-on-surface px-4 py-3 focus:ring-0 resize-none placeholder:text-on-surface-variant/50"
              id="message"
              name="message"
              placeholder="Detail your project requirements here..."
              rows={5}
            ></textarea>
          </div>
          <div className="pt-8 flex justify-center">
            <button
              className="liquid-glass rounded-full px-10 py-4 font-label-sm text-label-sm tracking-widest text-on-surface hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 ease-out active:scale-95 group flex items-center gap-3"
              type="button"
            >
              SEND INQUIRY
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-300">
                arrow_forward
              </span>
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="w-full py-section-gap px-margin-desktop bg-transparent flex flex-col items-center justify-center gap-element-gap z-10 relative">
        <Link
          className="font-headline-md text-headline-md text-on-surface opacity-80 hover:opacity-100 transition-opacity"
          href="/"
        >
          The Shutter Bug
        </Link>
        <div className="flex items-center gap-6 mt-4">
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
        <p className="font-label-sm text-label-sm text-on-surface-variant mt-8 opacity-50">
          © 2024 The Shutter Bug. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
