import AccountClient from "./AccountClient";

export const metadata = {
  title: "Account — Studio",
};

/**
 * Sign-in email and password (owner request, 2026-11-15). This address used
 * to redirect to About, where the page copy lived under "Account" until the
 * Studio reorganisation earlier that day.
 */
export default function AccountPage() {
  return <AccountClient />;
}
