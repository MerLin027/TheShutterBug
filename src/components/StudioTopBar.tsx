import type { ReactNode } from "react";

/**
 * The Studio's page header, extracted from the three hand-rolled copies that
 * used to live in DashboardClient, MessagesClient and AccountClient. All
 * three had drifted: same intent, but each carried its own glass recipe
 * (`bg-surface/10 backdrop-blur-3xl border-b border-white/15`) which matched
 * neither .nav-pill, .liquid-glass nor .filter-group — a fourth glass
 * treatment on a site that had already settled on three.
 *
 * It also absorbs the section header each page used to render *below* it.
 * Dashboard printed "Curated Gallery" here and "Portfolio Management /
 * Gallery" 80px underneath; Messages printed "Messages" and then "Inbox /
 * All Submissions". Two page titles, one page. The count that justified the
 * lower block moves up here as a quiet sibling to the title instead.
 *
 * The `pl-20 md:pl-gutter` is not decoration — below `md` the StudioMenu
 * hamburger is fixed at top-6 left-6, and without that inset the title
 * renders underneath it.
 */
export default function StudioTopBar({
  title,
  count,
  children,
}: {
  title: string;
  /** e.g. "12 frames". Omit while loading rather than flashing "0". */
  count?: string;
  /** Page actions, right-aligned. */
  children?: ReactNode;
}) {
  return (
    <header className="studio-topbar sticky top-0 z-30">
      <div className="flex justify-between items-center gap-4 px-gutter py-4 w-full h-20 pl-20 md:pl-gutter">
        <div className="flex items-baseline gap-3 min-w-0">
          {/* No font-semibold override — the headline-md token already
              carries weight 500, and the override was the only reason the
              Studio's headings sat heavier than the public site's. */}
          <h1 className="font-headline-md text-headline-md text-on-surface truncate">
            {title}
          </h1>
          {count && (
            <span className="hidden sm:inline font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
              {count}
            </span>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-3 shrink-0">{children}</div>
        )}
      </div>
    </header>
  );
}
