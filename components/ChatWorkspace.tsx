"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil, Trash2, Menu, X, Sun, Moon } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Composer } from "@/components/Composer";
import { Conversation } from "@/components/Conversation";
import { Brand, IconButton, MenuItem, Modal, Popover } from "@/components/ui";
import {
  STORAGE_KEY,
  type Attachment,
  type Chat,
  type Message,
} from "@/lib/types";

type Dialog = "rename" | "delete" | "delete-all" | "about" | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function isAttachment(value: unknown): value is Attachment {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.size === "number"
  );
}
function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    ["user", "assistant"].includes(String(value.role)) &&
    typeof value.content === "string" &&
    (value.attachments === undefined ||
      (Array.isArray(value.attachments) &&
        value.attachments.every(isAttachment)))
  );
}
function isChat(value: unknown): value is Record<string, unknown> & {
  id: string;
  title: string;
  messages: Message[];
} {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    value.incognito !== true &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  );
}
// Keep only the fields the app still uses, so older saved chats (with pin/project/feedback data) load cleanly.
function toChat(value: {
  id: string;
  title: string;
  messages: Message[];
}): Chat {
  return {
    id: value.id,
    title: value.title,
    messages: value.messages.map(({ id, role, content, attachments }) => ({
      id,
      role,
      content,
      ...(attachments ? { attachments } : {}),
    })),
  };
}

export default function ChatWorkspace() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState("");
  const [toast, setToast] = useState("");
  const [draftVersion, setDraftVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = chats.find((chat) => chat.id === activeId);
  const thinking = !!active && busyId === active.id;
  const closeDialog = useCallback(() => setDialog(null), []);
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    document.title = active
      ? `${active.title} · Sokha`
      : "Sokha — Your space to think";
  }, [active, active?.title]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        if (isRecord(saved)) {
          if (Array.isArray(saved.chats))
            setChats(saved.chats.filter(isChat).map(toChat));
          if (saved.theme === "light" || saved.theme === "dark")
            setTheme(saved.theme);
          if (typeof saved.collapsed === "boolean")
            setCollapsed(saved.collapsed);
        }
      } catch {
        setToast(
          "Saved workspace could not be loaded. A fresh workspace is ready.",
        );
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chats, theme, collapsed }),
      );
    } catch {
      queueMicrotask(() => {
        setToast(
          "Browser storage is unavailable. Changes will last for this session only.",
        );
      });
    }
  }, [chats, theme, collapsed, ready]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  function open(id: string | null) {
    setActiveId(id);
    setMobileOpen(false);
  }
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setBusyId(null);
  }
  function newChat() {
    setDraftVersion((value) => value + 1);
    open(null);
  }
  function demoResponse(
    id: string,
    research: boolean,
    web: boolean,
    files: boolean,
  ) {
    stop();
    setBusyId(id);
    const response =
      "Thanks for your message. This interface is a local demo, so no model is connected yet. Once one is, replies will stream in right here." +
      (research || web
        ? "\n\n" +
          [research && "Research", web && "Web search"]
            .filter(Boolean)
            .join(" and ") +
          " is selected for this message. These tools will be available when a model is connected."
        : "") +
      (files
        ? "\n\nYour attachment names are included in this preview. File contents have not been uploaded or analyzed."
        : "");
    timer.current = setTimeout(() => {
      const messageId = crypto.randomUUID();
      let progress = 0;
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === id
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { id: messageId, role: "assistant", content: "" },
                ],
              }
            : chat,
        ),
      );
      const tick = () => {
        progress = Math.min(progress + 14, response.length);
        setChats((previous) =>
          previous.map((chat) =>
            chat.id === id
              ? {
                  ...chat,
                  messages: chat.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, content: response.slice(0, progress) }
                      : message,
                  ),
                }
              : chat,
          ),
        );
        if (progress < response.length) timer.current = setTimeout(tick, 25);
        else {
          setBusyId(null);
          timer.current = null;
        }
      };
      tick();
    }, 1500);
  }
  function send(
    text: string,
    attachments: Attachment[],
    research: boolean,
    web: boolean,
  ) {
    const id = active?.id ?? crypto.randomUUID();
    const message = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: text,
      attachments,
    };
    if (active)
      setChats((previous) =>
        previous.map((chat) =>
          chat.id === id
            ? { ...chat, messages: [...chat.messages, message] }
            : chat,
        ),
      );
    else {
      const chat: Chat = {
        id,
        title: (text || attachments[0]?.name || "New conversation").slice(
          0,
          65,
        ),
        messages: [message],
      };
      setChats((previous) => [chat, ...previous]);
      open(id);
    }
    demoResponse(id, research, web, attachments.length > 0);
  }
  function removeActive() {
    if (active?.id === busyId) stop();
    setChats((previous) => previous.filter((chat) => chat.id !== active?.id));
    setDialog(null);
    open(null);
  }
  function toggleSidebar() {
    if (window.innerWidth <= 700) setMobileOpen((value) => !value);
    else setCollapsed((value) => !value);
  }
  function showDialog(value: Dialog) {
    setName(value === "rename" ? (active?.title ?? "") : "");
    setDialog(value);
  }

  return (
    <>
      <div className="workspace" data-theme={theme}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          chats={chats}
          activeId={active?.id ?? null}
          theme={theme}
          onCollapse={toggleSidebar}
          onNew={newChat}
          onSelect={(id) => open(id)}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onDeleteAll={() => showDialog("delete-all")}
          onDevices={() => showDialog("about")}
        />
        <main className={`main-panel ${active ? "has-conversation" : ""}`}>
          <header className="main-header">
            <IconButton
              label="Open sidebar"
              className="mobile-menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </IconButton>
            {active && (
              <Popover
                label="Conversation options"
                triggerClass="conversation-title"
                trigger={
                  <>
                    <span className="truncate">{active.title}</span>
                    <ChevronDown size={13} />
                  </>
                }
              >
                {(close) => (
                  <>
                    <MenuItem
                      onClick={() => {
                        showDialog("rename");
                        close();
                      }}
                    >
                      <Pencil />
                      Rename
                    </MenuItem>
                    <div className="menu-divider" />
                    <MenuItem
                      danger
                      onClick={() => {
                        showDialog("delete");
                        close();
                      }}
                    >
                      <Trash2 />
                      Delete
                    </MenuItem>
                  </>
                )}
              </Popover>
            )}
            <div className="ml-auto flex items-center gap-2">
              <IconButton
                label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                onClick={() =>
                  setTheme((value) => (value === "dark" ? "light" : "dark"))
                }
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
            </div>
          </header>
          {active ? (
            <>
              <Conversation
                messages={active.messages}
                thinking={
                  thinking && active.messages.at(-1)?.role !== "assistant"
                }
                onNotify={notify}
              />
              <Composer
                key={active.id}
                inConversation
                thinking={thinking}
                onSend={send}
                onStop={stop}
                onNotify={notify}
              />
            </>
          ) : (
            <div className="home-content">
              <div className="greeting">
                <Brand />
                <h1>Back at it, Ann</h1>
              </div>
              <Composer
                key={`new-${draftVersion}`}
                inConversation={false}
                thinking={false}
                onSend={send}
                onStop={stop}
                onNotify={notify}
              />
            </div>
          )}
        </main>
        {toast && (
          <div className="toast" role="status">
            {toast}
            <IconButton
              label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={14} />
            </IconButton>
          </div>
        )}
        {dialog && (
          <Modal
            title={
              {
                rename: "Rename conversation",
                delete: "Delete conversation?",
                "delete-all": "Delete all chats?",
                about: "Your workspace",
              }[dialog]
            }
            onClose={closeDialog}
          >
            {dialog === "rename" && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!name.trim()) return;
                  setChats((previous) =>
                    previous.map((chat) =>
                      chat.id === active?.id
                        ? { ...chat, title: name.trim() }
                        : chat,
                    ),
                  );
                  closeDialog();
                }}
              >
                <label className="field-label" htmlFor="name">
                  Conversation name
                </label>
                <input
                  id="name"
                  className="text-input"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="outline-button"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    disabled={!name.trim()}
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
            {(dialog === "delete" || dialog === "delete-all") && (
              <>
                <p className="dialog-description">
                  {dialog === "delete"
                    ? `“${active?.title}” will be removed from this browser. This cannot be undone.`
                    : "All conversations will be removed from this browser. This cannot be undone."}
                </p>
                <div className="modal-actions">
                  <button className="outline-button" onClick={closeDialog}>
                    Cancel
                  </button>
                  <button
                    className="danger-button"
                    onClick={() => {
                      if (dialog === "delete") removeActive();
                      else {
                        stop();
                        setChats([]);
                        open(null);
                        closeDialog();
                      }
                    }}
                  >
                    {dialog === "delete"
                      ? "Delete conversation"
                      : "Delete all chats"}
                  </button>
                </div>
              </>
            )}
            {dialog === "about" && (
              <>
                <div className="about-brand">
                  <Brand />
                  <h3>Sokha</h3>
                </div>
                <p className="dialog-description">
                  Your space to think, explore and create.
                </p>
                <p className="dialog-description">
                  This is a local frontend demo. Conversations and preferences
                  are saved in this browser. No AI model is connected.
                </p>
                <button className="outline-button mt-5" onClick={closeDialog}>
                  Got it
                </button>
              </>
            )}
          </Modal>
        )}
      </div>
    </>
  );
}
