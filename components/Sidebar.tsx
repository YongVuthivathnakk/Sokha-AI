import { useRef, useState } from "react";
import { Menu, PanelLeft, ChevronLeft, ChevronRight, Plus, Search, FolderClosed, ChevronDown, Sun, Moon, Trash2, MonitorSmartphone, X, Pin } from "lucide-react";
import { IconButton, MenuItem, Popover } from "./ui";
import type { Chat } from "@/lib/types";

type Props = {
  collapsed: boolean; mobileOpen: boolean; chats: Chat[]; activeId: string | null; view: "chat" | "projects"; theme: "dark" | "light";
  searchOpen: boolean; setSearchOpen: (open: boolean) => void; onCollapse: () => void; onNew: () => void; onProjects: () => void;
  onSelect: (id: string) => void; onTheme: () => void; onDeleteAll: () => void; onBack: () => void; onForward: () => void;
  canBack: boolean; canForward: boolean; onDevices: () => void;
};

export function Sidebar(props: Props) {
  const [query, setQuery] = useState("");
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const search = useRef<HTMLInputElement>(null);
  const visible = props.chats.filter(chat => !chat.incognito && `${chat.title} ${chat.messages.map(message => message.content).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const pinned = visible.filter(chat => chat.pinned);
  const recent = visible.filter(chat => !chat.pinned);
  function openSearch() { props.setSearchOpen(true); setTimeout(() => search.current?.focus(), 0); }
  const themeLabel = props.theme === "dark" ? "Light mode" : "Dark mode";
  function chatList(chats: Chat[], empty: string) {
    return chats.length ? chats.map(chat => <button key={chat.id} className={`chat-link ${props.activeId === chat.id && props.view === "chat" ? "active" : ""}`} onClick={() => props.onSelect(chat.id)} title={chat.title}><span className="truncate">{chat.title}</span>{chat.pinned && <Pin size={11} className="shrink-0 muted" />}</button>) : <p className="sidebar-empty">{query ? "No matching chats" : empty}</p>;
  }
  return <>
    {props.mobileOpen && <button className="sidebar-scrim" aria-label="Close sidebar" onClick={props.onCollapse} />}
    <aside aria-label="Sidebar" className={`sidebar ${props.collapsed ? "is-collapsed" : ""} ${props.mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-tools">
        <Popover label="Main menu" trigger={<Menu size={16} />} triggerClass="icon-button" className="main-menu">
          {close => <><MenuItem onClick={() => { props.onNew(); close(); }}><Plus />New chat</MenuItem><MenuItem onClick={() => { openSearch(); close(); }}><Search />Search chats</MenuItem><MenuItem onClick={() => { props.onTheme(); close(); }}>{props.theme === "dark" ? <Sun /> : <Moon />}{themeLabel}</MenuItem></>}
        </Popover>
        <IconButton label={props.collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={props.onCollapse}><PanelLeft size={16} /></IconButton>
        <div className="sidebar-expanded flex"><IconButton label="Go back" disabled={!props.canBack} onClick={props.onBack}><ChevronLeft size={16} /></IconButton><IconButton label="Go forward" disabled={!props.canForward} onClick={props.onForward}><ChevronRight size={16} /></IconButton></div>
      </div>
      <nav className="sidebar-navigation">
        <button className={`nav-item ${props.view === "chat" && !props.activeId ? "active" : ""}`} onClick={props.onNew} title="New chat"><Plus size={17} /><span className="sidebar-expanded">New</span></button>
        {props.searchOpen && !props.collapsed ? <div className="sidebar-search"><Search size={15} /><input ref={search} autoFocus aria-label="Search chats" placeholder="Search chats" value={query} onChange={event => setQuery(event.target.value)} /><IconButton label="Close search" onClick={() => { props.setSearchOpen(false); setQuery(""); }}><X size={13} /></IconButton></div> : <button className="nav-item" onClick={openSearch} title="Search chats"><Search size={17} /><span className="sidebar-expanded">Search</span><kbd className="sidebar-expanded">Ctrl+K</kbd></button>}
        <button className={`nav-item ${props.view === "projects" ? "active" : ""}`} onClick={props.onProjects} title="Projects"><FolderClosed size={17} /><span className="sidebar-expanded">Projects</span></button>
      </nav>
      <div className="sidebar-expanded sidebar-history">
        <section><button className="section-label" aria-expanded={pinnedOpen} onClick={() => setPinnedOpen(!pinnedOpen)}>Pinned <ChevronDown size={11} className={pinnedOpen ? "" : "-rotate-90"} /></button>{pinnedOpen && chatList(pinned, "Pin chats to keep them here")}</section>
        <section><button className="section-label" aria-expanded={recentOpen} onClick={() => setRecentOpen(!recentOpen)}>Recents <ChevronDown size={11} className={recentOpen ? "" : "-rotate-90"} /></button>{recentOpen && chatList(recent, "Your chats will show up here")}</section>
      </div>
      <div className="account-row">
        <Popover label="Account" side="top" triggerClass="account-button" trigger={<><span className="avatar" /><span className="sidebar-expanded account-name">Ann <span className="muted">· Pro</span></span><ChevronDown size={13} className="sidebar-expanded muted" /></>}>
          {close => <><div className="menu-caption">Ann · Pro plan</div><MenuItem onClick={() => { props.onTheme(); close(); }}>{props.theme === "dark" ? <Sun /> : <Moon />}{themeLabel}</MenuItem><div className="menu-divider" /><MenuItem danger onClick={() => { props.onDeleteAll(); close(); }}><Trash2 />Delete all chats</MenuItem></>}
        </Popover>
        <IconButton label="About this workspace" className="sidebar-expanded" onClick={props.onDevices}><MonitorSmartphone size={16} /></IconButton>
      </div>
    </aside>
  </>;
}
