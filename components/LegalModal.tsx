"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

export type LegalDoc = "terms" | "privacy";

const DOCS: Record<LegalDoc, { title: string; href: string }> = {
  terms: { title: "Terms of Service", href: "/terms" },
  privacy: { title: "Privacy Policy", href: "/privacy" },
};

/**
 * Button that opens a legal document (Terms of Service / Privacy Policy) in
 * the in-page {@link LegalModal}.
 *
 * Must be rendered as type="button" (never submits the surrounding form) and
 * stops click propagation so that, when placed inside the consent <label>,
 * clicking the link never toggles the checkbox.
 */
export function LegalLink({
  doc,
  onOpen,
  className,
  children,
}: {
  doc: LegalDoc;
  onOpen: (doc: LegalDoc) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(doc);
      }}
      className={className}
    >
      {children ?? DOCS[doc].title}
    </button>
  );
}

/**
 * In-page dialog for reading the Terms of Service / Privacy Policy without
 * leaving the current form — no popups (which embedded/preview browsers can
 * block), no navigation (which would wipe in-progress form input).
 *
 * Shows the real document page in a same-origin frame, with an "Open full
 * page" fallback link for users who prefer a standalone tab.
 */
export default function LegalModal({
  doc,
  onClose,
}: {
  doc: LegalDoc | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [doc, onClose]);

  if (!doc) return null;
  const meta = DOCS[doc];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-soft sm:h-[88vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {meta.title}
          </h2>
          <div className="flex items-center gap-2">
            <a
              href={meta.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-navy-400 hover:text-navy-700"
            >
              <ExternalLink size={13} /> Open full page
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${meta.title}`}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <iframe
          src={meta.href}
          title={meta.title}
          className="h-full w-full flex-1 border-0 bg-white"
        />
      </div>
    </div>
  );
}
