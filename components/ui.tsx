import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? "brand-small" : ""}`} aria-label="Sokha"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 18V7h9" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15.5" cy="14" r="2.3" fill="white" /></svg></span>;
}

export function IconButton({ label, children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} className={`icon-button ${className}`} {...props}>{children}</button>;
}

export function Popover({ label, trigger, children, className = "", align = "left", side = "bottom", triggerClass = "", onOpen }: { label: string; trigger: ReactNode; children: ReactNode | ((close: () => void) => ReactNode); className?: string; align?: "left" | "right"; side?: "top" | "bottom"; triggerClass?: string; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={root} className={`popover-anchor ${className}`}>
    <button ref={button} type="button" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} className={triggerClass} onClick={() => { setOpen(!open); if (!open) onOpen?.(); }} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setTimeout(() => root.current?.querySelector<HTMLButtonElement>(".popover button")?.focus(), 0); } }}>{trigger}</button>
    {open && <div id={id} className={`popover popover-${align} popover-${side}`} aria-label={label} onKeyDown={event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled), input"));
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }}>{typeof children === "function" ? children(() => setOpen(false)) : children}</div>}
  </div>;
}

export function MenuItem({ children, danger = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return <button type="button" className={`menu-item ${danger ? "danger" : ""}`} {...props}>{children}</button>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const node = ref.current;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex="0"]') ?? []);
    const input = node?.querySelector<HTMLElement>("input, textarea");
    (input ?? focusables()[0])?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = focusables();
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("keydown", handle); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={id}><div className="flex items-center justify-between gap-4"><h2 id={id}>{title}</h2><IconButton label="Close dialog" onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>;
}
