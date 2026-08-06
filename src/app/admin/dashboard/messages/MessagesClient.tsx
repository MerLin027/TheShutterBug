"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://theshutterbug.onrender.com";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesClient() {
  const router = useRouter();

  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  });

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!token) {
      router.replace("/admin");
    }
  }, [token, router]);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        router.replace("/admin");
        return;
      }
      if (!res.ok) {
        setError("Failed to load messages. Please try again.");
        return;
      }
      const data: ContactMessage[] = await res.json();
      setMessages(data);
    } catch {
      setError("Network error. Could not fetch messages.");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);

  function handleSignOut() {
    localStorage.removeItem("admin_token");
    router.replace("/admin");
  }

  if (!token) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-primary-container">
        <div className="admin-spinner" />
      </div>
    );
  }

  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-screen antialiased selection:bg-surface-variant selection:text-on-surface">
      <div className="flex h-screen overflow-hidden">
        {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
        <nav className="hidden md:flex flex-col h-full p-4 gap-element-gap bg-surface-container-lowest text-primary fixed left-0 top-0 w-64 border-r border-outline-variant z-40">
          <div className="mb-8 px-2 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Portfolio Logo"
                className="w-10 h-10 rounded-full object-cover border border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYNW773jLhQpdZIoV8HPMnJKDiMphlHxAFrGd6jZza8mljuuIMVMsjLrlGXobIise9FJrDYGN3qJJvEdDVIjDGW1jP0vB2eD6ONysq--iFZ7Pp6rEh82zU5Ly7JjMCHEipK9c8vSZ5SOzRVjCIeslYsAhk3iiLX8pr9DHntZRVnafiPG5sqLfRh9j2M9r_wYz2b92DNYeW024RNX94e5fKbDE5M0Hs_62jqZK4l52bNEziquOV64qn"
              />
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  The Shutter Bug
                </h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  Photography Admin
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 mt-4">
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                dashboard
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Dashboard
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                photo_library
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Gallery
              </span>
            </a>
            {/* Messages — active */}
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg bg-secondary-container text-on-secondary-container transition-all group"
              href="/admin/dashboard/messages"
            >
              <span className="material-symbols-outlined text-[20px]">
                mail
              </span>
              <span className="font-label-sm text-label-sm uppercase font-bold">
                Messages
              </span>
              {messages.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-primary text-on-primary rounded-full px-2 py-0.5">
                  {messages.length}
                </span>
              )}
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                analytics
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Analytics
              </span>
            </a>
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                person
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Account
              </span>
            </a>
          </div>

          <div className="flex flex-col gap-2 mt-auto border-t border-white/5 pt-4">
            <a
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all group"
              href="#"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                help
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Support
              </span>
            </a>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:text-error/80 hover:bg-surface-container-high transition-all group w-full text-left"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                logout
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Sign Out
              </span>
            </button>
          </div>
        </nav>

        {/* ─── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 md:ml-64 relative h-full overflow-y-auto overflow-x-hidden">
          {/* Top Bar */}
          <header className="fixed top-0 w-full md:w-[calc(100%-16rem)] z-50 bg-surface/10 backdrop-blur-3xl border-b border-white/15">
            <div className="flex justify-between items-center px-gutter py-4 w-full h-20">
              <div className="flex items-center gap-4">
                <h1 className="font-headline-md text-headline-md font-semibold text-on-surface truncate">
                  Contact Messages
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchMessages}
                  className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all"
                  title="Refresh"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Admin profile"
                  className="w-10 h-10 rounded-full object-cover border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF3babSoyoypQ4V5Bkjxfv03_jv8H8Ttdo1lRZ8tqkpbaHL_Z7Cv5NGCWEkQ3c3IFS6OgfH7dbrDZOYajXzrSYnvKgogX2GtqZwj_aeUGv2ke4SIyCGjBT_flAIfxN_jLrnMqxhhAQkVQKLz3q6zejx9sJdHn0MvgLVEkeFtn6xgmrg1QZA54tdqexTOIy4TwF6O6sBPfpayDHtaYW70ReMrS2DEzIAI5gUo2wjZwJcpIWPJyK8egQ"
                />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="pt-28 px-margin-mobile md:px-margin-desktop pb-section-gap min-h-full">
            {/* Section Header */}
            <div className="mb-10 flex justify-between items-end">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">
                  Inbox
                </p>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                  All Submissions
                </h2>
              </div>
              {!loading && (
                <span className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant font-label-sm text-label-sm uppercase">
                  {messages.length} {messages.length === 1 ? "Message" : "Messages"}
                </span>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-32">
                <div className="admin-spinner" />
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                <span className="material-symbols-outlined text-[48px] text-error/60">
                  error_outline
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                  {error}
                </p>
                <button
                  onClick={fetchMessages}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-on-surface font-label-sm text-label-sm uppercase transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="material-symbols-outlined text-[64px] text-outline/40 mb-6">
                  mail_outline
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
                  No messages yet
                </h3>
                <p className="font-body-md text-body-md text-outline max-w-xs leading-relaxed">
                  When visitors submit the contact form their messages will
                  appear here.
                </p>
              </div>
            )}

            {/* Messages List */}
            {!loading && !error && messages.length > 0 && (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => {
                  const isOpen = expanded === msg._id;
                  return (
                    <div
                      key={msg._id}
                      className="liquid-glass rounded-xl overflow-hidden transition-all duration-300"
                    >
                      {/* Row header — always visible */}
                      <button
                        onClick={() => setExpanded(isOpen ? null : msg._id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
                      >
                        {/* Avatar initial */}
                        <div className="shrink-0 w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm uppercase font-bold">
                          {msg.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                            <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                              {msg.name}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                              {msg.email}
                            </span>
                          </div>
                          {!isOpen && (
                            <p className="font-body-md text-body-md text-on-surface-variant truncate mt-0.5">
                              {msg.message}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-3">
                          <span className="hidden sm:block font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                            {formatDate(msg.createdAt)}
                          </span>
                          <span
                            className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          >
                            expand_more
                          </span>
                        </div>
                      </button>

                      {/* Expanded message body */}
                      {isOpen && (
                        <div className="px-5 pb-5 border-t border-white/5">
                          <div className="flex flex-col gap-4 pt-4">
                            {/* Metadata row */}
                            <div className="flex flex-wrap gap-4 text-on-surface-variant">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">
                                  person
                                </span>
                                <span className="font-label-sm text-label-sm uppercase">
                                  {msg.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">
                                  mail
                                </span>
                                <a
                                  href={`mailto:${msg.email}`}
                                  className="font-label-sm text-label-sm uppercase text-primary hover:underline"
                                >
                                  {msg.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-1.5 sm:hidden">
                                <span className="material-symbols-outlined text-[16px]">
                                  schedule
                                </span>
                                <span className="font-label-sm text-label-sm uppercase">
                                  {formatDate(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                            {/* Message body */}
                            <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </p>
                            {/* Quick reply button */}
                            <div>
                              <a
                                href={`mailto:${msg.email}?subject=Re: Your inquiry`}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-on-surface font-label-sm text-label-sm uppercase transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  reply
                                </span>
                                Reply via Email
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile sign-out bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-white/10 z-40">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-error hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              <span className="font-label-sm text-label-sm uppercase">
                Sign Out
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
