"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import { MessageListSkeleton, StudioBoot } from "@/components/StudioSkeletons";

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
        localStorage.removeItem("admin_email");
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

  if (!token) {
    return <StudioBoot />;
  }

  return (
    <StudioShell>
      {/* One heading, in the bar — this page used to print "Messages" here
          and "Inbox / All Submissions" again directly below it. */}
      <StudioTopBar
        title="Messages"
        count={
          loading
            ? undefined
            : `${messages.length} ${messages.length === 1 ? "message" : "messages"}`
        }
      >
        <button
          onClick={fetchMessages}
          className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-all"
          title="Refresh"
          aria-label="Refresh messages"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </StudioTopBar>

      {/* Content Area */}
      <div className="px-margin-mobile md:px-margin-desktop py-10 min-h-full">
        {/* Loading */}
        {loading && <MessageListSkeleton />}

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
              className="btn-outline flex items-center gap-2 px-6 py-2.5 text-on-surface font-label-sm text-label-sm uppercase"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 mb-6">
              mail_outline
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">
              No messages yet
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant/70 max-w-xs leading-relaxed">
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
                /* .studio-card, not .liquid-glass: one blur layer per row
                   inside a scrolling container is the exact per-card glass
                   the design philosophy rules out. */
                <div
                  key={msg._id}
                  className="studio-card rounded-2xl overflow-hidden"
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
                        <span className="font-body-md text-body-md text-on-surface font-bold truncate">
                          {msg.name}
                        </span>
                        <span className="font-label-sm text-label-sm text-accent truncate">
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
                              className="font-label-sm text-label-sm uppercase text-accent hover:underline"
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
                            className="btn-outline inline-flex items-center gap-2 px-5 py-2 text-on-surface font-label-sm text-label-sm uppercase"
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
    </StudioShell>
  );
}
