"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Lock, MessageCircle, Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface ChatPartner {
  key: string;
  name: string;
}

/**
 * Shared private chat used by the student, parent, tutor, and admin
 * dashboards. Threads are strictly between the signed-in user and one other
 * party (JWT-enforced on the server).
 *
 * Chat partners come only from real data: existing conversations plus
 * whatever the "new chat" picker offers (real registered tutors for
 * students/parents, real registered users for admins). No mock/demo people
 * are ever listed.
 */
export default function PrivateChat({
  myKey,
  pickerOptions,
  pickerFetchAction,
  pickerLabel = "＋ Start a new chat…",
  emptyListHint = "No conversations yet — use “Start a new chat” to message someone.",
  minThreadHeight = "min-h-[420px]",
}: {
  myKey: string;
  /** Static picker options (e.g. real users for the admin dashboard). */
  pickerOptions?: ChatPartner[];
  /** API action to fetch real picker options (e.g. "list_chat_tutors"). */
  pickerFetchAction?: string;
  pickerLabel?: string;
  emptyListHint?: string;
  minThreadHeight?: string;
}) {
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [active, setActive] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchedChoices, setFetchedChoices] = useState<ChatPartner[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Picker choices are either supplied (admin: real users) or fetched
  // (students/parents: real tutors) — derived, not synced, to avoid
  // cascading renders.
  const pickerChoices = pickerOptions ?? fetchedChoices;

  const token = typeof window === "undefined" ? "" : localStorage.getItem("tutorconnect_token") || "";
  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Load existing conversations + picker options (real accounts only).
  useEffect(() => {
    if (!myKey) return;
    let active = true;
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    fetch(`/api/messages?conversations=1${qs}`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : { conversations: [] }))
      .then((data) => {
        if (!active) return;
        const convos: ChatPartner[] = (data.conversations ?? []).map(
          (c: { partnerKey: string; partnerName: string }) => ({ key: c.partnerKey, name: c.partnerName || "User" })
        );
        setPartners(convos);
        setActive((prev) => (prev && convos.some((p) => p.key === prev.key) ? prev : convos[0] ?? null));
      })
      .catch(() => {});

    if (pickerFetchAction) {
      fetch(`/api/auth?action=${pickerFetchAction}${qs}`, { headers: authHeaders })
        .then((res) => (res.ok ? res.json() : { tutors: [] }))
        .then((data) => {
          if (active && Array.isArray(data.tutors)) {
            setFetchedChoices(data.tutors.map((t: { id: string; fullName: string }) => ({ key: t.id, name: t.fullName })));
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token/myKey only change on login
  }, [myKey, pickerFetchAction]);

  // Load the active thread and poll for new messages every 5 seconds.
  useEffect(() => {
    if (!myKey || !active) return;
    let alive = true;
    const qs =
      (token ? `&token=${encodeURIComponent(token)}` : "") + `&with=${encodeURIComponent(active.key)}`;
    const load = () =>
      fetch(`/api/messages?${qs}`, { headers: authHeaders })
        .then((res) => (res.ok ? res.json() : { messages: [] }))
        .then((data) => {
          if (alive && Array.isArray(data.messages)) setMessages(data.messages);
        })
        .catch(() => {})
        .finally(() => {
          if (alive) setLoading(false);
        });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flagging loading state while initiating the thread fetch
    setLoading(true);
    load();
    const interval = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- thread identity + token only
  }, [myKey, active?.key]);

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const send = useCallback(async () => {
    if (!active || !input.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ to: active.key, body: input.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message as ChatMessage]);
        setInput("");
        setPartners((prev) => (prev.some((p) => p.key === active.key) ? prev : [...prev, active]));
      } else {
        setError(data.error || "Message failed to send — please try again.");
      }
    } catch {
      setError("Could not reach the server — check your connection and try again.");
    } finally {
      setSending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token stable per login
  }, [active, input, sending, token]);

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  const unpicked = pickerChoices.filter((p) => !partners.some((x) => x.key === p.key));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
        <h2 className="font-display font-bold text-slate-900">Messages</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Lock size={13} /> Private — only the two of you can see these messages
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-[240px_minmax(0,1fr)]">
        {/* Conversation list + new chat picker */}
        <div className={`border-slate-100 p-3 sm:border-r ${active ? "hidden sm:block" : "block"}`}>
          {pickerChoices.length > 0 && (
            <div className="mb-2 px-1">
              <select
                value=""
                onChange={(e) => {
                  const choice = pickerChoices.find((p) => p.key === e.target.value);
                  if (choice) {
                    setPartners((prev) => (prev.some((p) => p.key === choice.key) ? prev : [...prev, choice]));
                    setActive(choice);
                  }
                }}
                className="w-full rounded-xl border border-navy-200 bg-navy-50 px-3 py-2 text-xs font-bold text-navy-700 focus:border-navy-600 focus:outline-none"
                aria-label="Start a new chat"
              >
                <option value="">{pickerLabel}</option>
                {unpicked.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Conversations</p>
          <div className="space-y-1">
            {partners.length === 0 && (
              <p className="px-2 py-2 text-xs leading-relaxed text-slate-400">{emptyListHint}</p>
            )}
            {partners.map((p) => (
              <button
                key={p.key}
                onClick={() => setActive(p)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active?.key === p.key ? "bg-navy-50 text-navy-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 text-xs font-bold text-white">
                  {initials(p.name)}
                </span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex min-w-0 flex-col ${minThreadHeight} ${active ? "flex" : "hidden sm:flex"}`}>
          {active ? (
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-600 text-xs font-bold text-white">
                  {initials(active.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{active.name}</p>
                  <p className="text-[11px] text-slate-400">Messages refresh automatically</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loading ? (
                  <p className="py-10 text-center text-sm text-slate-400">Loading conversation…</p>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No messages yet — say hello to {active.name.split(" ")[0]} in the box below.
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderKey === myKey;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            mine ? "rounded-br-md bg-navy-700 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-navy-200" : "text-slate-400"}`}>
                            {mine ? "You" : m.senderName} ·{" "}
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-100 p-3">
                {error && <p className="mb-2 text-xs font-semibold text-rose-500">{error}</p>}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`Message ${active.name.split(" ")[0]}…`}
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-navy-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="btn-primary !rounded-full !px-4 !py-2.5 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? "…" : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <MessageCircle size={40} className="text-slate-200" />
              <p className="text-sm font-semibold text-slate-600">Pick a conversation to start chatting</p>
              <p className="max-w-xs text-xs leading-relaxed text-slate-400">{emptyListHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
