import { useState } from "react";
import { Menu, PanelLeft, Plus, ChevronDown, Sun, Moon, Trash2, MonitorSmartphone } from "lucide-react";
import { IconButton, MenuItem, Popover } from "./ui";
import type { Chat } from "@/lib/types";

type Props = {
  collapsed: boolean; mobileOpen: boolean; chats: Chat[]; activeId: string | null; theme: "dark" | "light";
  onCollapse: () => void; onNew: () => void; onSelect: (id: string) => void; onTheme: () => void; onDeleteAll: () => void; onDevices: () => void;
};

export function Sidebar(props: Props) {
  const [recentOpen, setRecentOpen] = useState(true);
  const themeLabel = props.theme === "dark" ? "Light mode" : "Dark mode";
  return <>
    {props.mobileOpen && <button className="sidebar-scrim" aria-label="Close sidebar" onClick={props.onCollapse} />}
    <aside aria-label="Sidebar" className={`sidebar ${props.collapsed ? "is-collapsed" : ""} ${props.mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-tools">
        <Popover label="Main menu" trigger={<Menu size={16} />} triggerClass="icon-button" className="main-menu">
          {close => <><MenuItem onClick={() => { props.onNew(); close(); }}><Plus />New chat</MenuItem><MenuItem onClick={() => { props.onTheme(); close(); }}>{props.theme === "dark" ? <Sun /> : <Moon />}{themeLabel}</MenuItem></>}
        </Popover>
        <IconButton label={props.collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={props.onCollapse}><PanelLeft size={16} /></IconButton>
      </div>
      <nav className="sidebar-navigation">
        <button className={`nav-item ${!props.activeId ? "active" : ""}`} onClick={props.onNew} title="New chat"><Plus size={17} /><span className="sidebar-expanded">New</span></button>
      </nav>
      <div className="sidebar-expanded sidebar-history">
        <section><button className="section-label" aria-expanded={recentOpen} onClick={() => setRecentOpen(!recentOpen)}>Recents <ChevronDown size={11} className={recentOpen ? "" : "-rotate-90"} /></button>
          {recentOpen && (props.chats.length ? props.chats.map(chat => <button key={chat.id} className={`chat-link ${props.activeId === chat.id ? "active" : ""}`} onClick={() => props.onSelect(chat.id)} title={chat.title}><span className="truncate">{chat.title}</span></button>) : <p className="sidebar-empty">Your chats will show up here</p>)}
        </section>
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
