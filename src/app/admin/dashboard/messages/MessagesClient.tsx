"use client";

import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { useAdminToken } from "@/lib/useAdminToken";
import StudioShell from "@/components/StudioShell";
import StudioTopBar from "@/components/StudioTopBar";
import StudioModal from "@/components/StudioModal";
import Spinner from "@/components/Spinner";
import { MessageListSkeleton, StudioBoot } from "@/components/StudioSkeletons";
import { ChevronDown, CircleAlert, Mail, RefreshCw, Trash2 } from "lucide-react";

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
      <StudioTopBar
        title="Messages"
        count={
          loading || error
            ? undefined
            : `${messages.length} ${messages.length === 1 ? "message" : "messages"}`
        }
      >
        <button
          type="button"
          onClick={fetchMessages}
          className="tool-btn size-11"
          title="Refresh"
          aria-label="Refresh messages"
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </StudioTopBar>

      <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
        {loading && <MessageListSkeleton />}

        {!loading && error && (
          <div role="alert" className="flex flex-col items-center px-6 py-24 text-center">
            <CircleAlert size={32} className="mb-5 text-fg-3" aria-hidden="true" />
            <p className="lede max-w-sm">{error}</p>
            <button type="button" onClick={fetchMessages} className="btn btn-quiet mt-6">
              <RefreshCw size={16} aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center px-6 py-24 text-center">
            <Mail size={32} className="mb-5 text-fg-3" aria-hidden="true" />
            <h2 className="studio-heading">No messages yet</h2>
            <p className="lede mt-3 max-w-sm">
              Messages sent from the contact form appear here.
            </p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <ul className="flex flex-col border-t border-line">
            {messages.map((msg) => {
              const isOpen = expanded === msg._id;
              const bodyId = `message-${msg._id}`;
              return (
                <li key={msg._id} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : msg._id)}
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    className="group flex w-full items-center gap-5 py-5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="truncate font-display text-[1.45rem] leading-tight text-fg transition-colors group-hover:text-[#fff8ec]">{msg.name}</span>
                        <span className="truncate text-label text-fg-2">{msg.email}</span>
                      </span>
                      {!isOpen && (
                        <span className="mt-1 block truncate text-body-md text-fg-3">{msg.message}</span>
                      )}
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span className="frame-meta hidden whitespace-nowrap sm:block">
                        {formatDate(msg.createdAt)}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        size={18}
                        className={`text-fg-3 transition-[transform,color] duration-300 group-hover:text-fg ${isOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div id={bodyId} className="enter pb-6">
                      <p className="frame-meta mb-3 sm:hidden">{formatDate(msg.createdAt)}</p>
                      {/* Plain, selectable text — not a mailto: link. Nothing
                          in this project sends or composes email (owner's
                          standing rule); the address is here to be copied.
                          Phones only: wider screens show it in the row. */}
                      <p className="mb-4 select-all text-label text-fg-2 sm:hidden">{msg.email}</p>
                      {/* React escapes this; whitespace-pre-wrap keeps the
                          sender's line breaks. Never rendered as HTML. */}
                      <p className="max-w-[65ch] whitespace-pre-wrap text-lead text-fg">
                        {msg.message}
                      </p>
                      <div className="mt-6 flex justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setDeletingMessage(msg);
                          }}
                          className="btn btn-quiet h-10 !text-error"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete confirmation — dismissible={!deleting} so a delete in flight
          can't be dismissed by Escape or a backdrop click. */}
      {deletingMessage && (
        <StudioModal
          size="sm"
          title="Delete message?"
          dismissible={!deleting}
          onClose={() => setDeletingMessage(null)}
        >
          <p className="text-body-md text-fg-2">
            This permanently removes {deletingMessage.name}&rsquo;s message. It
            can&apos;t be undone.
          </p>
          {deleteError && (
            <p role="alert" className="text-body-md text-error">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingMessage(null)}
              disabled={deleting}
              className="btn btn-quiet"
            >
              Cancel
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting} className="btn btn-danger">
              {deleting ? <Spinner /> : <Trash2 size={16} aria-hidden="true" />}
              Delete
            </button>
          </div>
        </StudioModal>
      )}
    </StudioShell>
  );
}
