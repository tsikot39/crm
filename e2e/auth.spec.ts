import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display landing page correctly", async ({ page }) => {
    await expect(page).toHaveTitle(/CRM/);
    await expect(page.getByText(/modern crm/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /get started/i })
    ).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("should display login form validation errors", async ({ page }) => {
    await page.goto("/login");

    // Click submit without filling form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    await page.goto("/login");

    await page.getByText(/forgot your password/i).click();
    await expect(page).toHaveURL("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /reset password/i })
    ).toBeVisible();
  });

  test("should register new user successfully", async ({ page }) => {
    await page.goto("/signup");

    // Fill registration form
    await page.getByLabel(/first name/i).fill("Test");
    await page.getByLabel(/last name/i).fill("User");
    await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByLabel(/organization name/i).fill("Test Organization");

    // Submit form
    await page.getByRole("button", { name: /create account/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL("/dashboard");
  });
});
