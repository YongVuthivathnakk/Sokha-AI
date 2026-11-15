import { FolderClosed, Plus, ArrowUpRight, Paperclip } from "lucide-react";
import type { Chat, Project } from "@/lib/types";

export function Projects({ projects, chats, onCreate, onNewChat, onOpen }: { projects: Project[]; chats: Chat[]; onCreate: () => void; onNewChat: () => void; onOpen: (id: string) => void }) {
  return <section className="projects-page"><div className="projects-heading"><FolderClosed size={24} className="muted" /><h1>Projects</h1></div><p className="muted project-description">Keep chats, files and instructions together for each piece of work.</p>
    <div className="flex gap-2 mt-6 mb-8"><button className="outline-button" onClick={onNewChat}><Plus size={15} />New chat</button><button className="outline-button" onClick={onCreate}><FolderClosed size={15} />New project</button></div>
    <div className="project-grid">{projects.map(project => <button className="project-card" key={project.id} onClick={() => onOpen(project.id)}><div className="flex items-center justify-between"><FolderClosed size={21} className="muted" /><ArrowUpRight size={16} className="muted" /></div><h2>{project.name}</h2><p>{project.description || "A little space for your next big idea."}</p><div className="project-meta"><span>{chats.filter(chat => !chat.incognito && chat.project === project.id).length} chats</span>{project.files.length > 0 && <span className="flex items-center gap-1"><Paperclip size={12} />{project.files.length} files</span>}</div></button>)}</div>
  </section>;
}
