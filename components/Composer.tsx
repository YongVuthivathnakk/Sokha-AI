import { useRef, useState, useEffect } from "react";
import { Plus, Mic, AudioLines, ChevronDown, Paperclip, PanelLeft, Globe, Ghost, ArrowUp, Square, X, FileText, Check } from "lucide-react";
import type { Attachment, Project } from "@/lib/types";
import { IconButton, MenuItem, Popover } from "./ui";

type Props = { incognito: boolean; inConversation: boolean; thinking: boolean; projects: Project[]; projectId: string | null; onProject: (id: string | null) => void; onSend: (text: string, attachments: Attachment[], research: boolean, web: boolean) => void; onStop: () => void; onNotify: (message: string) => void; onProjectFiles: () => void };
type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: SpeechResult) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };

export function Composer(props: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [research, setResearch] = useState(false);
  const [web, setWeb] = useState(false);
  const [recording, setRecording] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const files = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => () => recognition.current?.stop(), []);
  useEffect(() => { if (textarea.current) { textarea.current.style.height = "auto"; textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 180)}px`; } }, [text]);
  function send() {
    if ((!text.trim() && !attachments.length) || props.thinking) return;
    props.onSend(text.trim(), attachments, research, web); setText(""); setAttachments([]); textarea.current?.focus();
  }
  function dictate() {
    if (recording) { recognition.current?.stop(); return; }
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const SpeechRecognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!SpeechRecognition) { props.onNotify("Voice input is not supported in this browser. Try Chrome or Edge."); return; }
    const instance = new SpeechRecognition(); recognition.current = instance;
    instance.lang = language; instance.continuous = false; instance.interimResults = false;
    instance.onresult = event => setText(value => `${value}${value ? " " : ""}${event.results[0][0].transcript}`);
    instance.onerror = () => { setRecording(false); props.onNotify("Voice input could not start. Check your browser’s microphone permission."); };
    instance.onend = () => setRecording(false);
    try { instance.start(); setRecording(true); } catch { props.onNotify("Microphone unavailable. Please try again."); }
  }
  return <div className={`composer-area ${props.inConversation ? "conversation-composer" : ""}`}>
    <form className="composer" onSubmit={event => { event.preventDefault(); send(); }}>
      {!!attachments.length && <div className="attachment-list">{attachments.map((file, index) => <span className="attachment" key={`${file.name}-${index}`}><FileText size={14} /><span className="truncate max-w-40">{file.name}</span><IconButton label={`Remove ${file.name}`} onClick={() => setAttachments(items => items.filter((_, i) => i !== index))}><X size={12} /></IconButton></span>)}</div>}
      <textarea ref={textarea} rows={1} aria-label="Message" placeholder={props.inConversation ? "Reply..." : "How can I help you today?"} value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
      <div className="composer-toolbar">
        <div className="flex items-center gap-2 min-w-0">
          <Popover label="Add attachments and tools" trigger={<Plus size={17} />} triggerClass="icon-button add-button" side={props.inConversation ? "top" : "bottom"}>
            {close => <><MenuItem onClick={() => { files.current?.click(); close(); }}><Paperclip />Add files or photos</MenuItem><MenuItem onClick={() => { props.onProjectFiles(); close(); }}><PanelLeft />Add from a project</MenuItem><div className="menu-divider" /><MenuItem aria-pressed={research} onClick={() => setResearch(!research)}><span className={`checkbox ${research ? "checked" : ""}`}>{research && <Check size={10} />}</span>Research</MenuItem><MenuItem aria-pressed={web} onClick={() => setWeb(!web)}><span className={`checkbox ${web ? "checked" : ""}`}>{web && <Check size={10} />}</span><Globe />Web search</MenuItem></>}
          </Popover>
          {props.incognito && <span className="tool-chip"><Ghost size={13} />Incognito</span>}
          {research && <button type="button" className="tool-chip" onClick={() => setResearch(false)}>Research<X size={11} /></button>}
          {web && <button type="button" className="tool-chip" onClick={() => setWeb(false)}><Globe size={12} />Web search<X size={11} /></button>}
        </div>
        <div className="flex items-center composer-voice">
          <IconButton label={recording ? "Stop dictation" : "Dictate message"} className={recording ? "recording" : ""} onClick={dictate}><Mic size={16} /></IconButton>
          <Popover label="Voice language" align="right" side="top" trigger={<ChevronDown size={12} />} triggerClass="icon-button tiny-button">{close => <><div className="menu-caption">Dictation language</div>{[["en-US", "English"], ["km-KH", "Khmer"]].map(([code, name]) => <MenuItem key={code} onClick={() => { setLanguage(code); close(); }}><span className="selection-dot">{language === code ? "•" : ""}</span>{name}</MenuItem>)}</>}</Popover>
          {props.thinking ? <IconButton label="Stop response" className="send-button" onClick={props.onStop}><Square size={13} fill="currentColor" /></IconButton> : text.trim() || attachments.length ? <IconButton label="Send message" className="send-button" onClick={send}><ArrowUp size={17} /></IconButton> : <IconButton label="Voice input" onClick={dictate}><AudioLines size={17} /></IconButton>}
        </div>
      </div>
      <input type="file" ref={files} multiple className="hidden" aria-label="Attach files" onChange={event => {
        const selected = Array.from(event.target.files ?? []);
        const accepted = selected.filter(file => file.size <= 20 * 1024 * 1024);
        if (accepted.length !== selected.length) props.onNotify("Please choose files smaller than 20 MB.");
        setAttachments(previous => [...previous, ...accepted.map(file => ({ name: file.name, size: file.size }))].slice(0, 10)); event.target.value = "";
      }} />
    </form>
    {!props.inConversation ? <Popover label="Project or folder" triggerClass="project-selector" trigger={<>{props.projects.find(project => project.id === props.projectId)?.name ?? "Project or folder"}<ChevronDown size={13} /></>}>
      {close => <><MenuItem onClick={() => { props.onProject(null); close(); }}><span className="selection-dot">{props.projectId === null ? "•" : ""}</span>No project</MenuItem>{props.projects.map(project => <MenuItem key={project.id} onClick={() => { props.onProject(project.id); close(); }}><span className="selection-dot">{props.projectId === project.id ? "•" : ""}</span>{project.name}</MenuItem>)}</>}
    </Popover> : <p className="demo-note">Demo interface · No model is connected</p>}
  </div>;
}
