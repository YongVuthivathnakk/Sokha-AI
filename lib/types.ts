export type Attachment = { name: string; size: number };
export type Message = { id: string; role: "user" | "assistant"; content: string; attachments?: Attachment[]; feedback?: "up" | "down" };
export type Chat = { id: string; title: string; pinned: boolean; project: string | null; messages: Message[]; incognito: boolean };
export type Project = { id: string; name: string; description: string; files: Attachment[] };
export const STORAGE_KEY = "sokha-workspace-v1";
export const DEFAULT_PROJECTS: Project[] = ["Study notes", "Games project", "Work"].map((name, index) => ({ id: `project-${index}`, name, description: "", files: [] }));
