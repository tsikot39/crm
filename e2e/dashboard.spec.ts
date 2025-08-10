import { test, expect } from "@playwright/test";

test.describe("CRM Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL("/dashboard");
  });

  test("should display dashboard statistics", async ({ page }) => {
    // Check main statistics are visible
    await expect(page.getByText(/total contacts/i)).toBeVisible();
    await expect(page.getByText(/total companies/i)).toBeVisible();
    await expect(page.getByText(/active deals/i)).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();
  });

  test("should show navigation sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /contacts/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /companies/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /deals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
  });

  test("should navigate to contacts page", async ({ page }) => {
    await page.getByRole("link", { name: /contacts/i }).click();
    await expect(page).toHaveURL("/contacts");
    await expect(
      page.getByRole("heading", { name: /contacts/i })
    ).toBeVisible();
  });

  test("should navigate to companies page", async ({ page }) => {
    await page.getByRole("link", { name: /companies/i }).click();
    await expect(page).toHaveURL("/companies");
    await expect(
      page.getByRole("heading", { name: /companies/i })
    ).toBeVisible();
  });

  test("should navigate to deals page", async ({ page }) => {
    await page.getByRole("link", { name: /deals/i }).click();
    await expect(page).toHaveURL("/deals");
    await expect(page.getByRole("heading", { name: /deals/i })).toBeVisible();
  });

  test("should show recent activities section", async ({ page }) => {
    await expect(page.getByText(/recent activit/i)).toBeVisible();
  });

  test("should display charts and analytics", async ({ page }) => {
    await expect(page.getByText(/revenue trend/i)).toBeVisible();
    await expect(page.getByText(/deals pipeline/i)).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // Click user menu or logout button
    await page.getByRole("button", { name: /logout/i }).click();

    // Should redirect to landing page
    await expect(page).toHaveURL("/");
  });
});
