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
      {/* Three columns, not a two-way flex: the empty first column is what
          puts the title on the bar's true centre line rather than on the
          centre of whatever space the action buttons happen to leave. The
          actions stay in their own column, so centring can never overlap
          them — the grid reserves the space either way. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-gutter py-4 w-full min-h-20 pl-20 md:pl-gutter">
        <div aria-hidden="true" />

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 min-w-0">
          {/* On `text-headline-md` now that the type scale generates real
              utilities — this carried `text-2xl` as a stand-in while the
              token was dead. The `md:text-3xl` step is kept on purpose: the
              Studio's page title is the top of this screen's hierarchy and
              sits one notch above headline-md on desktop. */}
          <h1 className="font-headline-md text-headline-md md:text-3xl leading-tight text-on-surface truncate">
            {title}
          </h1>
          {count && (
            <span className="studio-count-pill font-label-sm text-xs uppercase tracking-widest">
              {count}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">{children}</div>
      </div>
    </header>
  );
}
