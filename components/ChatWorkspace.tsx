"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Ghost, Pin, PinOff, Pencil, Trash2, Menu, FolderClosed, Plus, FileText, X, Sun, Moon } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Composer } from "@/components/Composer";
import { Conversation } from "@/components/Conversation";
import { Projects } from "@/components/Projects";
import { Brand, IconButton, MenuItem, Modal, Popover } from "@/components/ui";
import { DEFAULT_PROJECTS, STORAGE_KEY, type Attachment, type Chat, type Project } from "@/lib/types";

type Dialog = "rename" | "delete" | "delete-all" | "create-project" | "project-files" | "about" | null;
type Location = { view: "chat" | "projects"; chatId: string | null };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isAttachment(value: unknown): value is Attachment { return isRecord(value) && typeof value.name === "string" && typeof value.size === "number"; }
function isChat(value: unknown): value is Chat {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.pinned === "boolean" && (value.project === null || typeof value.project === "string") && value.incognito === false && Array.isArray(value.messages) && value.messages.every(message => isRecord(message) && typeof message.id === "string" && ["user", "assistant"].includes(String(message.role)) && typeof message.content === "string" && (message.attachments === undefined || Array.isArray(message.attachments) && message.attachments.every(isAttachment)));
}
function isProject(value: unknown): value is Project { return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.description === "string" && Array.isArray(value.files) && value.files.every(isAttachment); }

export default function ChatWorkspace() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [incognito, setIncognito] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [history, setHistory] = useState<Location[]>([{ view: "chat", chatId: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState("");
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = history[historyIndex];
  const active = chats.find(chat => chat.id === current.chatId);
  const selectedProject = projects.find(project => project.id === openProject);
  const thinking = !!active && busyId === active.id;
  const closeDialog = useCallback(() => setDialog(null), []);
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    document.title = active ? `${active.title} · Sokha` : "Sokha — Your space to think";
  }, [active?.title]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (isRecord(saved)) {
        if (Array.isArray(saved.chats)) setChats(saved.chats.filter(isChat));
        if (Array.isArray(saved.projects)) setProjects(saved.projects.filter(isProject));
        if (saved.theme === "light" || saved.theme === "dark") setTheme(saved.theme);
        if (typeof saved.collapsed === "boolean") setCollapsed(saved.collapsed);
      }
    } catch { setToast("Saved workspace could not be loaded. A fresh workspace is ready."); }
    setReady(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats: chats.filter(chat => !chat.incognito), projects, theme, collapsed })); }
    catch { setToast("Browser storage is unavailable. Changes will last for this session only."); }
  }, [chats, projects, theme, collapsed, ready]);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(""), 4500); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => {
    if (active) { setIncognito(active.incognito); setProjectId(active.project); }
  }, [active?.id, active?.incognito, active?.project]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCollapsed(false); setSearchOpen(true); setMobileOpen(true); }
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handle); return () => document.removeEventListener("keydown", handle);
  }, []);

  function navigate(location: Location) { setHistory(previous => [...previous.slice(0, historyIndex + 1), location]); setHistoryIndex(historyIndex + 1); setMobileOpen(false); }
  function stop() { if (timer.current) clearTimeout(timer.current); timer.current = null; setBusyId(null); }
  function newChat(privateMode = incognito, nextProject = projectId) {
    if (busyId && chats.find(chat => chat.id === busyId)?.incognito) stop();
    setChats(previous => previous.filter(chat => !chat.incognito));
    setIncognito(privateMode); setProjectId(nextProject); setDraftVersion(value => value + 1); navigate({ view: "chat", chatId: null });
  }
  function selectChat(id: string) { const chat = chats.find(item => item.id === id); if (!chat) return; setIncognito(chat.incognito); setProjectId(chat.project); navigate({ view: "chat", chatId: id }); }
  function demoResponse(id: string, research: boolean, web: boolean, files: boolean) {
    stop(); setBusyId(id);
    const response = "Thanks for your message. This interface is a local demo, so no model is connected yet. Once one is, replies will stream in right here." + (research || web ? "\n\n" + [research && "Research", web && "Web search"].filter(Boolean).join(" and ") + " is selected for this message. These tools will be available when a model is connected." : "") + (files ? "\n\nYour attachment names are included in this preview. File contents have not been uploaded or analyzed." : "");
    timer.current = setTimeout(() => {
      const messageId = crypto.randomUUID(); let progress = 0;
      setChats(previous => previous.map(chat => chat.id === id ? { ...chat, messages: [...chat.messages, { id: messageId, role: "assistant", content: "" }] } : chat));
      const tick = () => {
        progress = Math.min(progress + 14, response.length);
        setChats(previous => previous.map(chat => chat.id === id ? { ...chat, messages: chat.messages.map(message => message.id === messageId ? { ...message, content: response.slice(0, progress) } : message) } : chat));
        if (progress < response.length) timer.current = setTimeout(tick, 25);
        else { setBusyId(null); timer.current = null; }
      };
      tick();
    }, 1500);
  }
  function send(text: string, attachments: Attachment[], research: boolean, web: boolean) {
    const id = active?.id ?? crypto.randomUUID();
    const message = { id: crypto.randomUUID(), role: "user" as const, content: text, attachments };
    if (active) setChats(previous => previous.map(chat => chat.id === id ? { ...chat, messages: [...chat.messages, message] } : chat));
    else {
      const chat: Chat = { id, title: (text || attachments[0]?.name || "New conversation").slice(0, 65), pinned: false, project: projectId, messages: [message], incognito };
      setChats(previous => [chat, ...previous]); navigate({ view: "chat", chatId: id });
    }
    demoResponse(id, research, web, attachments.length > 0);
  }
  function removeActive() {
    if (active?.id === busyId) stop();
    setChats(previous => previous.filter(chat => chat.id !== active?.id));
    setDialog(null); navigate({ view: "chat", chatId: null });
  }
  function toggleSidebar() { if (window.innerWidth <= 700) setMobileOpen(value => !value); else setCollapsed(value => !value); }
  function showDialog(value: Dialog) { setName(value === "rename" ? active?.title ?? "" : ""); setDescription(""); setDialog(value); }

  return <>
    <div className="workspace" data-theme={theme}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} chats={chats} activeId={active?.id ?? null} view={current.view} theme={theme} searchOpen={searchOpen} setSearchOpen={value => { setSearchOpen(value); if (value) setCollapsed(false); }} onCollapse={toggleSidebar} onNew={() => newChat()} onProjects={() => { setOpenProject(null); navigate({ view: "projects", chatId: null }); }} onSelect={selectChat} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")} onDeleteAll={() => showDialog("delete-all")} canBack={historyIndex > 0} canForward={historyIndex < history.length - 1} onBack={() => setHistoryIndex(index => Math.max(0, index - 1))} onForward={() => setHistoryIndex(index => Math.min(history.length - 1, index + 1))} onDevices={() => showDialog("about")} />
      <main className={`main-panel ${active ? "has-conversation" : ""}`}>
        <header className="main-header">
          <IconButton label="Open sidebar" className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></IconButton>
          {active && current.view === "chat" && <Popover label="Conversation options" triggerClass="conversation-title" trigger={<><span className="truncate">{active.title}</span><ChevronDown size={13} /></>}>
            {close => <><MenuItem onClick={() => { setChats(previous => previous.map(chat => chat.id === active.id ? { ...chat, pinned: !chat.pinned } : chat)); close(); }}>{active.pinned ? <PinOff /> : <Pin />}{active.pinned ? "Unpin" : "Pin"}</MenuItem><MenuItem onClick={() => { showDialog("rename"); close(); }}><Pencil />Rename</MenuItem><div className="menu-divider" /><MenuItem danger onClick={() => { showDialog("delete"); close(); }}><Trash2 />Delete</MenuItem></>}
          </Popover>}
          {current.view === "chat" && <div className="ml-auto flex items-center gap-2">
            <IconButton label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setTheme(value => value === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <IconButton label={incognito ? "Turn off incognito" : "Start incognito chat"} className={`incognito-toggle ${incognito ? "enabled" : ""}`} aria-pressed={incognito} onClick={() => newChat(!incognito, null)}><Ghost size={18} /></IconButton>
          </div>}
        </header>
        {current.view === "projects" ? selectedProject ? <section className="projects-page"><button className="back-link" onClick={() => setOpenProject(null)}>← All projects</button><div className="projects-heading mt-5"><FolderClosed size={25} className="muted" /><h1>{selectedProject.name}</h1></div><p className="muted project-description">{selectedProject.description || "Keep your conversations and ideas together."}</p><div className="flex gap-2 mt-6 mb-7"><button className="outline-button" onClick={() => newChat(false, selectedProject.id)}><Plus size={15} />New chat</button><button className="outline-button" onClick={() => { setProjectId(selectedProject.id); showDialog("project-files"); }}><FileText size={15} />Project files</button></div><div className="project-chat-list">{chats.filter(chat => chat.project === selectedProject.id && !chat.incognito).map(chat => <button key={chat.id} onClick={() => selectChat(chat.id)}>{chat.title}<span className="muted">{chat.messages.length} messages</span></button>)}{!chats.some(chat => chat.project === selectedProject.id && !chat.incognito) && <p className="muted">No conversations yet. Start a new chat to get going.</p>}</div></section> : <Projects projects={projects} chats={chats} onCreate={() => showDialog("create-project")} onNewChat={() => newChat(false, null)} onOpen={setOpenProject} /> : active ? <>
          <Conversation messages={active.messages} thinking={thinking && active.messages.at(-1)?.role !== "assistant"} onNotify={notify} onFeedback={(id, feedback) => setChats(previous => previous.map(chat => chat.id === active.id ? { ...chat, messages: chat.messages.map(message => message.id === id ? { ...message, feedback: message.feedback === feedback ? undefined : feedback } : message) } : chat))} onRetry={() => { setChats(previous => previous.map(chat => chat.id === active.id ? { ...chat, messages: chat.messages.slice(0, -1) } : chat)); demoResponse(active.id, false, false, false); }} />
          <Composer key={active.id} incognito={active.incognito} inConversation thinking={thinking} projects={projects} projectId={active.project} onProject={setProjectId} onSend={send} onStop={stop} onNotify={notify} onProjectFiles={() => showDialog("project-files")} />
        </> : <div className={`home-content ${incognito ? "incognito-home" : ""}`}><div className="greeting"><Brand /><h1>{incognito ? "Incognito chat" : "Back at it, Ann"}</h1></div>{incognito && <p className="incognito-description">Incognito chats aren’t saved to history.</p>}<Composer key={`new-${draftVersion}`} incognito={incognito} inConversation={false} thinking={false} projects={projects} projectId={projectId} onProject={setProjectId} onSend={send} onStop={stop} onNotify={notify} onProjectFiles={() => showDialog("project-files")} /></div>}
      </main>
      {toast && <div className="toast" role="status">{toast}<IconButton label="Dismiss notification" onClick={() => setToast("")}><X size={14} /></IconButton></div>}
      {dialog && <Modal title={{ rename: "Rename conversation", delete: "Delete conversation?", "delete-all": "Delete all chats?", "create-project": "Create a project", "project-files": "Project files", about: "Your workspace" }[dialog]} onClose={closeDialog}>
        {(dialog === "rename" || dialog === "create-project") && <form onSubmit={event => {
          event.preventDefault(); if (!name.trim()) return;
          if (dialog === "rename") setChats(previous => previous.map(chat => chat.id === active?.id ? { ...chat, title: name.trim() } : chat));
          else { const id = crypto.randomUUID(); setProjects(previous => [...previous, { id, name: name.trim(), description: description.trim(), files: [] }]); setOpenProject(id); navigate({ view: "projects", chatId: null }); }
          closeDialog();
        }}><label className="field-label" htmlFor="name">{dialog === "rename" ? "Conversation name" : "Project name"}</label><input id="name" className="text-input" value={name} maxLength={100} onChange={event => setName(event.target.value)} required />{dialog === "create-project" && <><label className="field-label" htmlFor="description">Description <span className="muted">(optional)</span></label><textarea id="description" className="text-input" rows={3} placeholder="What are you working on?" value={description} onChange={event => setDescription(event.target.value)} maxLength={500} /></>}<div className="modal-actions"><button type="button" className="outline-button" onClick={closeDialog}>Cancel</button><button className="primary-button" disabled={!name.trim()} type="submit">{dialog === "rename" ? "Save" : "Create project"}</button></div></form>}
        {(dialog === "delete" || dialog === "delete-all") && <><p className="dialog-description">{dialog === "delete" ? `“${active?.title}” will be removed from this browser. This cannot be undone.` : "All conversations will be removed from this browser. Your projects will remain. This cannot be undone."}</p><div className="modal-actions"><button className="outline-button" onClick={closeDialog}>Cancel</button><button className="danger-button" onClick={() => { if (dialog === "delete") removeActive(); else { stop(); setChats([]); setHistory([{ view: "chat", chatId: null }]); setHistoryIndex(0); closeDialog(); } }}>{dialog === "delete" ? "Delete conversation" : "Delete all chats"}</button></div></>}
        {dialog === "about" && <><div className="about-brand"><Brand /><h3>Sokha</h3></div><p className="dialog-description">Your space to think, explore and create.</p><p className="dialog-description">This is a local frontend demo. Conversations, preferences and project file names are saved in this browser. Incognito conversations are never saved. No AI model is connected, and files are not uploaded.</p><button className="outline-button mt-5" onClick={closeDialog}>Got it</button></>}
        {dialog === "project-files" && <><p className="dialog-description">Choose a project to manage its file list. This preview saves file names only.</p><label className="field-label" htmlFor="file-project">Project</label><select id="file-project" className="text-input" value={projectId ?? ""} onChange={event => setProjectId(event.target.value || null)}><option value="">Select a project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{projectId && <><div className="project-files">{projects.find(project => project.id === projectId)?.files.map((file, index) => <div key={index} className="flex items-center gap-2"><FileText size={15} /><span className="truncate flex-1">{file.name}</span><IconButton label={`Remove ${file.name}`} onClick={() => setProjects(previous => previous.map(project => project.id === projectId ? { ...project, files: project.files.filter((_, i) => i !== index) } : project))}><X size={14} /></IconButton></div>)}</div><label className="outline-button upload-label"><Plus size={15} />Add files<input type="file" multiple className="sr-only" onChange={event => { const added = Array.from(event.target.files ?? []).map(file => ({ name: file.name, size: file.size })); setProjects(previous => previous.map(project => project.id === projectId ? { ...project, files: [...project.files, ...added] } : project)); event.target.value = ""; }} /></label></>}<div className="modal-actions"><button className="primary-button" onClick={() => { if (projectId && active) setChats(previous => previous.map(chat => chat.id === active.id ? { ...chat, project: projectId } : chat)); closeDialog(); if (projectId) notify("Project linked to this chat. File contents are not uploaded in this demo."); }}>{projectId ? "Use project" : "Done"}</button></div></>}
      </Modal>}
    </div>
  </>;
}
