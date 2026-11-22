"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, CircleAlert } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { photoImage, type ApiPhoto } from "@/lib/data";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import { StudioBoot } from "@/components/StudioSkeletons";

type Message = { _id: string; name: string; message: string; createdAt: string };
type Content = {
  bio?: string;
  aboutImageUrl?: string;
  heroImageUrl?: string;
  showWorkStatement?: boolean;
};

/** The demo images came from the Stitch export host; real ones are Cloudinary. */
const isPlaceholder = (url?: string) => !url || url.includes("googleusercontent.com");

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Studio → Overview, the landing screen (Studio reorganisation, 2026-11-15).
 *
 * What's on the site and what's new, each linking to where it's managed —
 * plus "Needs attention": the things worth fixing before the site is shown
 * to anyone (demo placeholders still live, nothing featured, a broken
 * character in the bio). Each panel loads on its own; one failing doesn't
 * blank the others.
 */
export default function OverviewClient() {
  const { token, email, ready, signOut } = useAdminToken();

  const [photos, setPhotos] = useState<ApiPhoto[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [failed, setFailed] = useState<{ photos?: true; messages?: true; content?: true }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    async function get<T>(path: string, init?: RequestInit): Promise<T | null> {
      try {
        const res = await fetch(apiUrl(path), { cache: "no-store", ...init });
        if (res.status === 401) {
          signOut();
          return null;
        }
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    }

    (async () => {
      const [p, m, c] = await Promise.all([
        get<ApiPhoto[]>("/api/photos", auth),
        get<Message[]>("/api/contact", auth),
        get<Content>("/api/site-content"),
      ]);
      if (cancelled) return;
      setPhotos(p);
      setMessages(m);
      setContent(c);
      setFailed({ ...(p ? {} : { photos: true }), ...(m ? {} : { messages: true }), ...(c ? {} : { content: true }) });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, signOut]);

  if (!ready || !token || loading) return <StudioBoot label={ready && token ? "Loading the Studio" : undefined} />;

  const featured = photos?.filter((p) => p.isFeatured) ?? [];
  const byCategory = CATEGORIES.map((c) => ({ c, n: photos?.filter((p) => p.category === c).length ?? 0 })).filter(
    (x) => x.n > 0
  );
  const latest = messages?.slice(0, 3) ?? [];

  const attention: { text: string; href: string; action: string }[] = [];
  if (content && isPlaceholder(content.aboutImageUrl))
    attention.push({ text: "The About portrait is still the demo image.", href: "/admin/dashboard/about", action: "Change it" });
  if (content?.bio?.includes("�"))
    attention.push({ text: "The About bio contains an unreadable character (�).", href: "/admin/dashboard/about", action: "Fix the text" });
  if (photos && photos.length > 0 && featured.length === 0)
    attention.push({ text: "No photographs are featured, so the home page shows the first six from the gallery instead.", href: "/admin/dashboard/photos", action: "Star some" });
  if (photos && photos.length === 0)
    attention.push({ text: "The gallery is empty.", href: "/admin/dashboard/photos", action: "Upload photographs" });

  const unavailable = <p className="text-body-md text-error">Couldn&apos;t load this just now.</p>;

  return (
    <StudioShell>
      <StudioTopBar title="Overview" />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <div className="enter flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps">Studio</p>
            <h2 className="section-title mt-2">The Site at a Glance</h2>
          </div>
          <Link href="/" className="text-link self-start md:self-auto">
            View the site
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* ── Needs attention ─────────────────────────────────────────── */}
        {attention.length > 0 && (
          <section aria-labelledby="attention" className="enter mt-12" style={{ "--i": 1 } as CSSProperties}>
            <h3 id="attention" className="caps mb-3 flex items-center gap-2 !text-accent">
              <CircleAlert size={14} aria-hidden="true" />
              Needs Attention
            </h3>
            <ul className="border-t border-line">
              {attention.map((a) => (
                <li key={a.text} className="flex flex-col gap-2 border-b border-line py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-body-md text-fg">{a.text}</span>
                  <Link href={a.href} className="nav-link !h-auto shrink-0 gap-2 self-start sm:self-auto">
                    {a.action}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Ledger: one column per area ─────────────────────────────── */}
        <div className="enter mt-14 grid gap-12 border-t border-line pt-10 md:grid-cols-3 md:gap-10" style={{ "--i": 2 } as CSSProperties}>
          <section aria-labelledby="ov-photos">
            <h3 id="ov-photos" className="caps">Photographs</h3>
            {failed.photos ? unavailable : (
              <>
                <p className="mt-3 font-display text-[3.25rem] leading-none text-fg [font-variant-numeric:lining-nums]">{photos?.length ?? 0}</p>
                <p className="mt-3 text-body-md text-fg-2">
                  {featured.length} featured on Home
                </p>
                {byCategory.length > 0 && (
                  <p className="frame-meta mt-1">{byCategory.map((x) => `${categoryLabel(x.c)} ${x.n}`).join(" · ")}</p>
                )}
              </>
            )}
            <Link href="/admin/dashboard/photos" className="text-link mt-5">
              Manage
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section aria-labelledby="ov-messages">
            <h3 id="ov-messages" className="caps">Messages</h3>
            {failed.messages ? unavailable : (
              <>
                <p className="mt-3 font-display text-[3.25rem] leading-none text-fg [font-variant-numeric:lining-nums]">{messages?.length ?? 0}</p>
                <p className="mt-3 text-body-md text-fg-2">
                  {latest[0] ? `Latest ${shortDate(latest[0].createdAt)}` : "None yet"}
                </p>
              </>
            )}
            <Link href="/admin/dashboard/messages" className="text-link mt-5">
              Open inbox
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>

          <section aria-labelledby="ov-pages">
            <h3 id="ov-pages" className="caps">Pages</h3>
            {failed.content ? unavailable : (
              <dl className="mt-4 flex flex-col gap-3 text-body-md">
                <div>
                  <dt className="text-fg">Home</dt>
                  <dd className="text-fg-2">
                    {isPlaceholder(content?.heroImageUrl) ? "Demo background" : "Your background"} · &ldquo;The work&rdquo;{" "}
                    {content?.showWorkStatement === false ? "hidden" : "shown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg">About</dt>
                  <dd className="text-fg-2">
                    {isPlaceholder(content?.aboutImageUrl) ? "Demo portrait" : "Your portrait"} ·{" "}
                    {(content?.bio ?? "").split(/\n\s*\n/).filter((s) => s.trim()).length} paragraphs
                  </dd>
                </div>
              </dl>
            )}
            <div className="mt-5 flex gap-6">
              <Link href="/admin/dashboard/home" className="text-link">Home</Link>
              <Link href="/admin/dashboard/about" className="text-link">About</Link>
            </div>
          </section>
        </div>

        {/* ── Latest messages ─────────────────────────────────────────── */}
        {latest.length > 0 && (
          <section aria-labelledby="ov-latest" className="enter mt-16" style={{ "--i": 3 } as CSSProperties}>
            <h3 id="ov-latest" className="caps mb-3">Latest Messages</h3>
            <ul className="border-t border-line">
              {latest.map((m) => (
                <li key={m._id}>
                  <Link
                    href="/admin/dashboard/messages"
                    className="group flex items-baseline gap-5 border-b border-line py-4"
                  >
                    <span className="w-40 shrink-0 truncate font-display text-[1.3rem] leading-tight text-fg transition-colors group-hover:text-[#fff8ec]">
                      {m.name}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body-md text-fg-3">{m.message}</span>
                    <span className="frame-meta hidden shrink-0 sm:block">{shortDate(m.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Featured strip ──────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section aria-labelledby="ov-featured" className="enter mt-16" style={{ "--i": 4 } as CSSProperties}>
            <div className="mb-4 flex items-baseline justify-between">
              <h3 id="ov-featured" className="caps">Curated Work on Home</h3>
              <Link href="/admin/dashboard/photos?filter=featured" className="nav-link !h-auto">Edit</Link>
            </div>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {featured.slice(0, 6).map((p) => (
                <li key={p._id} className="frame-media aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary rendition */}
                  <img src={photoImage(p, 320)} alt={p.caption || `${categoryLabel(p.category)} photograph`} loading="lazy" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {email && (
          <p className="caps mt-20 border-t border-line pt-6">
            Signed in as <span className="normal-case tracking-normal text-fg-2">{email}</span>
          </p>
        )}
      </div>
    </StudioShell>
  );
}
