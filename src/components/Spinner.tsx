/**
 * The site's loading spinner. `.admin-spinner` in globals.css owns the look;
 * this owns the two sizes it is actually used at, so the inline
 * `!w-4 !h-4 !border-[1.5px]` override doesn't have to be retyped at all six
 * call sites (both Studio modals, the delete confirmation, the Account save,
 * the contact submit and the Studio login).
 *
 * "sm" is the in-button size. "md" is the bare class — the full-size spinner
 * on the boot screen.
 */
export default function Spinner({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const sized = size === "sm" ? "admin-spinner !w-4 !h-4 !border-[1.5px]" : "admin-spinner";
  return <div className={`${sized} ${className}`.trim()} aria-hidden="true" />;
}
