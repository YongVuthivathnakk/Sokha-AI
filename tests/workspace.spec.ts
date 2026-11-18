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

test("removed and hidden controls are not shown", async ({ page }) => {
  for (const name of ["Go back", "Go forward", "Search chats", "Projects", "Start incognito chat", "Add attachments and tools", "Dictate message", "Voice language", "Voice input", "Project or folder"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Pinned", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await expect(page.getByRole("button", { name: "New chat", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search chats", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await send(page, "Check response actions");
  await finished(page);
  await expect(page.getByRole("button", { name: "Copy response", exact: true })).toBeVisible();
  for (const name of ["Good response", "Poor response", "Regenerate response"]) await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Conversation options" }).click();
  await expect(page.getByRole("button", { name: "Pin", exact: true })).toHaveCount(0);
});

test("conversation thinks, replies, can be renamed and deleted", async ({ page }) => {
  await send(page, "First conversation");
  await expect(page.getByRole("status", { name: "Thinking" })).toBeVisible();
  await page.screenshot({ path: "test-results/thinking.png", fullPage: true });
  await finished(page);
  await expect(page).toHaveTitle("First conversation · Sokha");
  await expect(page.getByRole("article", { name: "Assistant response" })).toContainText("no model is connected yet");
  await page.screenshot({ path: "test-results/conversation.png", fullPage: true });
  await page.getByRole("button", { name: "Conversation options" }).click();
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByLabel("Conversation name", { exact: true }).fill("Interface ideas");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Interface ideas", exact: true }).click();
  await expect(page.getByRole("article", { name: "Assistant response" })).toBeVisible();
  await page.getByRole("button", { name: "Conversation options" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete conversation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Interface ideas", exact: true })).toHaveCount(0);
});

test("stop response, delete all and menu keyboard access", async ({ page }) => {
  await send(page, "Hello");
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByRole("status", { name: "Thinking" })).toHaveCount(0);
  await send(page, "Try again"); await finished(page);
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
  await send(page, "Mobile chat"); await finished(page);
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.getByRole("complementary")).toHaveClass(/mobile-open/);
  await page.locator(".sidebar-navigation").getByRole("button", { name: "New", exact: true }).click();
  await expect(page.getByRole("complementary")).not.toHaveClass(/mobile-open/);
  await expect(page.getByRole("heading", { name: "Back at it, Ann" })).toBeVisible();
});

test("saved data from the previous version still loads", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("sokha-workspace-v1", JSON.stringify({
    chats: [
      { id: "old", title: "Earlier chat", pinned: true, project: "project-0", incognito: false, messages: [{ id: "m1", role: "user", content: "Hi", feedback: "up" }] },
      { id: 1, title: null },
    ],
    projects: [null, 3], theme: "light",
  })));
  await page.reload();
  await expect(page.locator(".workspace")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Earlier chat", exact: true }).click();
  await expect(page.getByRole("article", { name: "Your message" })).toContainText("Hi");
  const saved = await page.evaluate(() => localStorage.getItem("sokha-workspace-v1"));
  expect(saved).not.toContain("pinned");
  expect(saved).not.toContain("projects");
});
