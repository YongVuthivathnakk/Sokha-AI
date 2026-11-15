import { expect, test, type Page } from "@playwright/test";

async function send(page: Page, message: string) {
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(message);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
async function finished(page: Page) { await expect(page.getByRole("button", { name: "Stop response" })).toHaveCount(0); }

test.beforeEach(async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible(); });

test("landing themes and sidebar persist", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await expect(page).toHaveTitle("Sokha — Your space to think");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator(".workspace")).toHaveCSS("display", "flex");
  await page.getByRole("button", { name: "Switch to light mode", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "test-results/home-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await page.getByRole("button", { name: "Light mode", exact: true }).click();
  await expect(page.locator(".workspace")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".nav-item.active")).toHaveCSS("background-color", "rgb(238, 237, 230)");
  await page.screenshot({ path: "test-results/home-light.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect(page.getByRole("complementary")).toHaveClass(/is-collapsed/);
  await page.reload();
  await expect(page.locator(".workspace")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByText("Your chats will show up here")).toBeVisible();
  expect(errors).toEqual([]);
});

test("conversation thinks, replies, can be pinned, renamed, searched and deleted", async ({ page }) => {
  await send(page, "First conversation");
  await expect(page.getByRole("status", { name: "Thinking" })).toBeVisible();
  await page.screenshot({ path: "test-results/thinking.png", fullPage: true });
  await finished(page);
  await expect(page).toHaveTitle("First conversation · Sokha");
  await expect(page.getByRole("article", { name: "Assistant response" })).toContainText("no model is connected yet");
  await page.screenshot({ path: "test-results/conversation.png", fullPage: true });
  await page.getByRole("button", { name: "Good response", exact: true }).click();
  await expect(page.getByRole("button", { name: "Good response", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Conversation options" }).click();
  await page.getByRole("button", { name: "Pin", exact: true }).click();
  await expect(page.locator(".sidebar-history section").first()).toContainText("First conversation");
  await page.getByRole("button", { name: "Conversation options" }).click();
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByLabel("Conversation name", { exact: true }).fill("Interface ideas");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.keyboard.press("Control+k");
  await page.getByRole("textbox", { name: "Search chats", exact: true }).fill("Interface");
  await expect(page.getByRole("button", { name: "Interface ideas", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search chats", exact: true }).fill("unmatched");
  await expect(page.getByRole("button", { name: "Interface ideas", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Close search" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Interface ideas", exact: true }).click();
  await expect(page.getByRole("article", { name: "Assistant response" })).toBeVisible();
  await page.getByRole("button", { name: "Conversation options" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete conversation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Interface ideas", exact: true })).toHaveCount(0);
});

test("incognito content is never saved", async ({ page }) => {
  await page.getByRole("button", { name: "Start incognito chat", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Incognito chat" })).toBeVisible();
  await page.screenshot({ path: "test-results/incognito.png", fullPage: true });
  await send(page, "Private thought never save");
  await finished(page);
  await expect(page.locator(".sidebar-history")).not.toContainText("Private thought never save");
  expect(await page.evaluate(() => localStorage.getItem("sokha-workspace-v1"))).not.toContain("Private thought never save");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
  await expect(page.getByText("Private thought never save", { exact: true })).toHaveCount(0);
});

test("projects can be created and associated with conversations", async ({ page }) => {
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("UX research");
  await page.getByLabel("Description", { exact: false }).fill("Explore the new interface");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("heading", { name: "UX research" })).toBeVisible();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.getByRole("button", { name: "Project or folder" })).toContainText("UX research");
  await send(page, "Plan user interviews");
  await finished(page);
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: /UX research.*1 chats/ }).click();
  await expect(page.locator(".project-chat-list").getByRole("button", { name: /Plan user interviews/ })).toBeVisible();
  await page.getByRole("button", { name: "Project files", exact: true }).click();
  await page.locator('.upload-label input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("Interview notes") });
  await expect(page.getByRole("dialog")).toContainText("notes.txt");
  await page.getByRole("button", { name: "Use project", exact: true }).click();
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem("sokha-workspace-v1"))).toContain("notes.txt");
});

test("composer tools, attachments and project dropdown work", async ({ page }) => {
  await page.getByRole("button", { name: "Project or folder", exact: true }).click();
  await page.getByRole("button", { name: "Study notes", exact: true }).click();
  await page.getByRole("button", { name: "Add attachments and tools" }).click();
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await page.getByRole("button", { name: "Web search", exact: true }).last().click();
  await page.keyboard.press("Escape");
  await page.getByLabel("Attach files", { exact: true }).setInputFiles({ name: "reference.txt", mimeType: "text/plain", buffer: Buffer.from("Example attachment") });
  await expect(page.locator(".attachment-list")).toContainText("reference.txt");
  await send(page, "Review this reference");
  await finished(page);
  await expect(page.getByRole("article", { name: "Assistant response" })).toContainText("Research and Web search");
  await expect(page.getByRole("article", { name: "Assistant response" })).toContainText("have not been uploaded");
});

test("stop and regenerate, delete all and menu keyboard access", async ({ page }) => {
  await send(page, "Hello");
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByRole("status", { name: "Thinking" })).toHaveCount(0);
  await send(page, "Try again"); await finished(page);
  await page.getByRole("button", { name: "Regenerate response" }).click();
  await expect(page.getByRole("status", { name: "Thinking" })).toBeVisible();
  await finished(page);
  await expect(page.getByRole("article", { name: "Assistant response" })).toHaveCount(1);
  await page.getByRole("button", { name: "Account", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Light mode", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Delete all chats", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
  await expect(page.locator(".chat-link")).toHaveCount(0);
});

test("mobile sidebar and layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Open sidebar", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: "test-results/mobile-home.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("complementary")).toHaveClass(/mobile-open/);
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("complementary")).not.toHaveClass(/mobile-open/);
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
});

test("invalid saved data does not crash the workspace", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("sokha-workspace-v1", JSON.stringify({ chats: [{ id: 1, title: null }], projects: [null, 3], theme: "light" })));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
  await send(page, "Fresh conversation");
  await finished(page);
  await expect(page.getByRole("article", { name: "Assistant response" })).toBeVisible();
});
