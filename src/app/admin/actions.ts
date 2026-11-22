"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { PHOTOS_TAG, SITE_CONTENT_TAG } from "@/lib/data";
import { API_URL } from "@/lib/api";

/**
 * Server Action: make the public pages reflect a Studio change immediately
 * (create / edit / delete / reorder / featured, and About-copy saves) instead
 * of after the 60-second revalidation window.
 *
 * Tags purge the cached DATA wherever it was fetched. That is what the path
 * calls alone could not do: /api/photos/:id was fetched only by
 * /lightbox/[id], which no path call named, so a deleted photo stayed
 * viewable at its own URL for up to a minute after it was removed.
 *
 * updateTag, not revalidateTag: in Next 16 revalidateTag(tag, "max") serves
 * the stale entry while refreshing in the background, which is exactly the
 * minute-long window this exists to close. updateTag expires the entry, so the
 * next request waits for fresh data.
 *
 * The path calls stay — they purge the rendered output, which tags alone
 * do not.
 *
 * Contact-message deletion deliberately does not call this: messages render
 * on no public page.
 *
 * Gated (Phase D9). A Server Action is a public POST endpoint: anyone who
 * finds its id can call it, and before this anyone could purge the cache on
 * every public page at will. Now it acts only for a caller whose Studio
 * session the API accepts (GET /api/auth/me), and otherwise does nothing.
 * Returns whether it purged.
 *
 * The session is the httpOnly cookie (audit F2): the browser sends it with
 * this action's request because the site and the cookie share a domain, and
 * it is passed on to the API here, server to server. Nothing on the page
 * ever sees it.
 */
const SESSION_COOKIE = "__Host-sb_session";

export async function revalidatePublicPages(): Promise<boolean> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session || session.length > 4096) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Cookie: `${SESSION_COOKIE}=${session}` },
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }

  updateTag(PHOTOS_TAG);
  updateTag(SITE_CONTENT_TAG);

  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath("/about");
  revalidatePath("/lightbox/[id]", "page");
  return true;
}
