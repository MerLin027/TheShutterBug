"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action: revalidate the public gallery and home pages so they
 * reflect admin changes (create/edit/delete/reorder) without waiting
 * for the 60-second ISR TTL to expire.
 */
export async function revalidatePublicPages() {
  revalidatePath("/work");
  revalidatePath("/");
}
