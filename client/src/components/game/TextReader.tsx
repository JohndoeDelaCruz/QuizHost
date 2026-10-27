import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ReadingEntry { label: string; text: string; answer?: number }

// Small text pages keep long teacher-written content readable without scrolling.
export function TextReader({ entries, onClose, onChoose, disabled = false }: {
  entries: ReadingEntry[];
  onClose: () => void;
  onChoose?: (index: number) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(0);
  const pages = entries.flatMap((entry) => {
    const characters = Array.from(entry.text);
    const pieces: string[] = [];
    while (characters.length) {
      let end = Math.min(100, characters.length);
      if (end < characters.length) {
        const boundary = characters.slice(0, end).join("").lastIndexOf(" ");
        if (boundary > 55) end = boundary + 1;
      }
      pieces.push(characters.splice(0, end).join(""));
    }
    return (pieces.length ? pieces : [""]).map((text) => ({ ...entry, text }));
  });
  const current = pages[Math.min(page, pages.length - 1)];
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="text-reader" aria-label="Read full text" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="text-reader-heading">
        <strong>{current.label}</strong>
        <button className="icon-button" aria-label="Close full text" onClick={onClose}><X size={20} /></button>
      </div>
      <p className="text-reader-body" aria-live="polite">{current.text}</p>
      <nav aria-label="Text pages">
        <button className="btn secondary small" aria-label="Previous text page" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
        <span>{page + 1} / {pages.length}</span>
        <button className="btn secondary small" aria-label="Next text page" disabled={page + 1 >= pages.length} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
      </nav>
      {onChoose && current.answer !== undefined && <button className="btn primary" disabled={disabled} onClick={() => { onChoose(current.answer!); onClose(); }}>Choose answer {"ABCD"[current.answer]}</button>}
    </dialog>
  );
}
