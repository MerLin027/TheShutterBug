"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action: revalidate the public pages so they reflect admin changes
 * (create/edit/delete/reorder, and About-copy saves) without waiting for the
 * 60-second ISR TTL to expire.
 *
 * /lightbox/[id] is deliberately not here — it's a dynamic route and gets
 * handled in Stage 5.
 */
export async function revalidatePublicPages() {
  revalidatePath("/work");
  revalidatePath("/");
  revalidatePath("/about");
}
