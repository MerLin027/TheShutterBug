import ContactClient from "./ContactClient";

export const metadata = { title: "Contact — The Shutter Bug" };

/** Contact. The form and its "What's it about?" picker live in ContactClient. */
export default function Contact() {
  return <ContactClient />;
}
