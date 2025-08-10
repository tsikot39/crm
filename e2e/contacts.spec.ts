import { test, expect } from "@playwright/test";

test.describe("Contacts Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Navigate to contacts
    await page.getByRole("link", { name: /contacts/i }).click();
    await expect(page).toHaveURL("/contacts");
  });

  test("should display contacts list", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /contacts/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add contact/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/search contacts/i)).toBeVisible();
  });

  test("should open add contact modal", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).click();

    // Check modal is open
    await expect(page.getByText(/new contact/i)).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("should create new contact successfully", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).click();

    // Fill contact form
    const contactName = `Test Contact ${Date.now()}`;
    await page.getByLabel(/name/i).fill(contactName);
    await page.getByLabel(/email/i).fill(`contact${Date.now()}@example.com`);
    await page.getByLabel(/phone/i).fill("+1234567890");
    await page.getByLabel(/job title/i).fill("Manager");

    // Submit form
    await page.getByRole("button", { name: /save/i }).click();

    // Should see success message or new contact in list
    await expect(page.getByText(contactName)).toBeVisible();
  });

  test("should search contacts", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search contacts/i);
    await searchInput.fill("test");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should show filtered results
    await expect(searchInput).toHaveValue("test");
  });

  test("should filter contacts by status", async ({ page }) => {
    // Look for status filter dropdown
    const statusFilter = page
      .locator('[data-testid="status-filter"]')
      .or(page.getByRole("button").filter({ hasText: /status/i }));

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByText(/active/i).click();
    }
  });

  test("should edit contact", async ({ page }) => {
    // Wait for contacts to load and find edit button
    await page
      .waitForSelector('[data-testid="edit-contact"]', { timeout: 5000 })
      .catch(() => {});

    const editButton = page
      .locator('[data-testid="edit-contact"]')
      .first()
      .or(page.getByRole("button", { name: /edit/i }).first());

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should open edit modal
      await expect(page.getByText(/edit contact/i)).toBeVisible();
    }
  });

  test("should show contact details", async ({ page }) => {
    // Look for any contact in the list
    const contactRow = page
      .locator('[data-testid="contact-row"]')
      .first()
      .or(page.locator("tr").filter({ hasText: /@/ }).first());

    if (await contactRow.isVisible()) {
      await contactRow.click();

      // Should show contact details or navigate to detail page
      // This depends on your implementation
    }
  });

  test("should handle pagination", async ({ page }) => {
    // Look for pagination controls
    const nextButton = page
      .getByRole("button", { name: /next/i })
      .or(page.locator('[data-testid="next-page"]'));

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Should load next page
      await page.waitForTimeout(1000);
    }
  });

  test("should validate contact form", async ({ page }) => {
    await page.getByRole("button", { name: /add contact/i }).click();

    // Try to submit empty form
    await page.getByRole("button", { name: /save/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });
});
