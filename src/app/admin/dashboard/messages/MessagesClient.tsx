"use client";

import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";
import { MessageListSkeleton, StudioBoot } from "@/components/StudioSkeletons";

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
  // Effect-based session read, not a lazy initialiser — see useAdminToken.
  const { token, ready, signOut } = useAdminToken();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Delete confirmation. Holds the whole message, not just its id, so the
  // dialog can name the sender.
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  // Kept separate from `error`: that one replaces the whole list with a
  // full-page error state, which is the wrong response to one row failing to
  // delete. This renders inside the dialog instead.
  const [deleteError, setDeleteError] = useState("");

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/contact"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        signOut();
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
  }, [token, signOut]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);

  // Backed by DELETE /api/contact/:id, added in Stage 4. Before it existed
  // there was no way to remove a message from anywhere in the app — the inbox
  // only ever grew.
  //
  // No revalidatePublicPages() here, unlike the photo and account mutations:
  // messages are never rendered on a public page.
  async function handleDelete() {
    if (!deletingMessage || !token) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(apiUrl(`/api/contact/${deletingMessage._id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        signOut();
        return;
      }

      if (!res.ok) {
        setDeleteError("Failed to delete the message. Please try again.");
        return;
      }

      // Drop it locally rather than refetching — the list is already correct
      // and a refetch would flash the skeleton for a single-row change.
      setMessages((prev) => prev.filter((m) => m._id !== deletingMessage._id));
      if (expanded === deletingMessage._id) setExpanded(null);
      setDeletingMessage(null);
    } catch {
      setDeleteError("Network error. Could not delete the message.");
    } finally {
      setDeleting(false);
    }
  }

  if (!ready || !token) {
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
          className="btn-icon-glass text-on-surface"
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
                            {/* Plain text, not a mailto: link — this app sends
                                no email and hands off to no mail client. The
                                address is here to be read and copied. */}
                            <span className="font-label-sm text-label-sm uppercase text-accent select-all">
                              {msg.email}
                            </span>
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
                        {/* Row actions. There was a "Reply via Email" mailto:
                            button here; removed on request. Nothing in this
                            project sends or composes email. */}
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => {
                              setDeleteError("");
                              setDeletingMessage(msg);
                            }}
                            className="btn-danger inline-flex items-center gap-2 px-6 py-2.5 font-label-sm text-label-sm uppercase"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
                            Delete
                          </button>
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

      {/* Delete confirmation — same shape as the photo delete in
          DashboardClient, including dismissible={!deleting} so a delete in
          flight can't be dismissed by Escape or a backdrop click. */}
      {deletingMessage && (
        <StudioModal
          size="sm"
          className="text-center"
          dismissible={!deleting}
          onClose={() => setDeletingMessage(null)}
        >
          <span className="material-symbols-outlined text-[48px] text-error mx-auto">
            delete_forever
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            Delete message?
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This will permanently remove {deletingMessage.name}&rsquo;s message
            from the database. This action cannot be undone.
          </p>
          {deleteError && (
            <p className="font-body-md text-body-md text-error">{deleteError}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeletingMessage(null)}
              disabled={deleting}
              className="btn-outline px-6 py-3 text-on-surface font-label-sm text-label-sm uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger px-6 py-3 font-label-sm text-label-sm uppercase flex items-center gap-2"
            >
              {deleting ? (
                <Spinner />
              ) : (
                <span className="material-symbols-outlined text-[16px]">
                  delete
                </span>
              )}
              Delete
            </button>
          </div>
        </StudioModal>
      )}
    </StudioShell>
  );
}
