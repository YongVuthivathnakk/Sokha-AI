export type Attachment = { name: string; size: number };
export type Message = { id: string; role: "user" | "assistant"; content: string; attachments?: Attachment[] };
export type Chat = { id: string; title: string; messages: Message[] };
export const STORAGE_KEY = "sokha-workspace-v1";
