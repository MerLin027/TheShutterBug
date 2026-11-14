/**
 * The site's loading spinner. `.admin-spinner` in globals.css owns the look
 * and draws in `currentColor`, so it reads on any button — the off-white
 * primary (dark ink), a quiet button (light ink) or the danger button.
 *
 * "sm" is the in-button size; "md" is the full-size boot spinner.
 */
export default function Spinner({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const sized = size === "sm" ? "admin-spinner admin-spinner-sm" : "admin-spinner";
  return <div className={`${sized} ${className}`.trim()} aria-hidden="true" />;
}
