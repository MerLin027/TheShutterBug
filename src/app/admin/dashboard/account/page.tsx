import { redirect } from "next/navigation";

/** Old address (the About copy lived under "Account" until 2026-11-15). */
export default function AccountMoved() {
  redirect("/admin/dashboard/about");
}
