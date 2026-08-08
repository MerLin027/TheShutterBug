/**
 * Loading and boot placeholders for the Studio.
 *
 * Every Studio surface previously rendered the same 32px spinner centred in
 * an otherwise empty black page — twice over, in fact: once while the token
 * check ran, and again while the data fetched. Two indistinguishable blank
 * screens in sequence is the state that reads as "this hasn't loaded" rather
 * than "this is loading".
 */

/** Fixed heights, not random ones — a masonry skeleton that reshuffles on
 *  every render is more distracting than a static one, and these repeat
 *  down the columns to suggest variable aspect ratios without churn. */
const CARD_HEIGHTS = [
  "h-64",
  "h-80",
  "h-56",
  "h-72",
  "h-60",
  "h-80",
  "h-64",
  "h-56",
];

/**
 * Photo grid placeholder. Mirrors DashboardClient's masonry exactly
 * (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4`), so the real cards
 * land roughly where their placeholders were instead of jumping.
 */
export function PhotoGridSkeleton() {
  return (
    <div
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-gutter space-y-gutter"
      aria-hidden="true"
    >
      {CARD_HEIGHTS.map((height, i) => (
        <div key={i} className={`skeleton break-inside-avoid w-full ${height}`} />
      ))}
    </div>
  );
}

/** Message list placeholder — matches the row rhythm of MessagesClient. */
export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="studio-card rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="skeleton !rounded-full w-9 h-9 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="skeleton !rounded-full h-3 w-1/3" />
            <div className="skeleton !rounded-full h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The pre-auth screen, shown for the moment between mount and the
 * localStorage token check resolving. Still a spinner — there's no layout to
 * skeleton yet, since which page renders depends on the answer — but it now
 * says what it's waiting for instead of spinning over a void.
 */
export function StudioBoot() {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-5 bg-primary-container">
      <div className="admin-spinner" />
      <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/60">
        Checking your session
      </p>
    </div>
  );
}
