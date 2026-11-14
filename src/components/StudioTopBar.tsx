import type { ReactNode } from "react";

/**
 * Studio page header (Redesign Phase C). One title per page, centred on the
 * bar — kept centred by the owner's earlier request (Studio UX pass) —
 * with the count as a quiet mono line beside it rather than a glowing pill.
 *
 * Opaque paper with a hairline, not glass: glass lives on exactly one
 * surface, the public navbar.
 *
 * Three columns, not a two-way flex: the empty first column puts the title
 * on the bar's true centre line rather than on the centre of whatever space
 * the actions leave. Below `md` the first column also clears the menu
 * button, which is fixed in this bar's left corner.
 */
export default function StudioTopBar({
  title,
  count,
  children,
}: {
  title: string;
  /** e.g. "6 frames". Omit while loading or failed rather than flashing "0". */
  count?: string;
  /** Page actions, right-aligned. */
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95">
      <div className="grid min-h-[4.25rem] grid-cols-[3rem_1fr_auto] items-center gap-3 px-3 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <div aria-hidden="true" />

        <div className="flex min-w-0 items-baseline justify-center gap-3">
          <h1 className="truncate text-heading font-medium text-fg">{title}</h1>
          {count && <span className="frame-meta hidden whitespace-nowrap sm:inline">{count}</span>}
        </div>

        <div className="flex items-center justify-end gap-2">{children}</div>
      </div>
    </header>
  );
}
