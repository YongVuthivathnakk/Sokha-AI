import { useEffect, useRef } from "react";
import { Copy, FileText } from "lucide-react";
import type { Message } from "@/lib/types";
import { Brand, IconButton } from "./ui";

export function Conversation({ messages, thinking, onNotify }: { messages: Message[]; thinking: boolean; onNotify: (message: string) => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, thinking]);
  return <div className="conversation-scroll"><div className="conversation-messages">
    {messages.map(message => <article key={message.id} className={`message message-${message.role}`} aria-label={message.role === "user" ? "Your message" : "Assistant response"}>
      {message.attachments?.length ? <div className="message-attachments">{message.attachments.map((file, i) => <span className="attachment" key={i}><FileText size={14} />{file.name}</span>)}</div> : null}
      <div className="message-content">{message.content}</div>
      {message.role === "assistant" && <><div className="message-actions">
        <IconButton label="Copy response" onClick={async () => { try { await navigator.clipboard.writeText(message.content); onNotify("Response copied."); } catch { onNotify("Could not copy. Select the response text to copy it."); } }}><Copy size={14} /></IconButton>
      </div><Brand small /></>}
    </article>)}
    {thinking && <div className="thinking" role="status" aria-label="Thinking"><span /><span /><span /><span className="sr-only">Thinking...</span></div>}
    <div ref={end} />
  </div></div>;
}
