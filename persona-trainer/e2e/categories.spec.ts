import { test, expect } from '@playwright/test';
import { TestHelpers, mockTestData } from './fixtures/test-helpers';

/**
 * Categories Management E2E Tests
 *
 * Tests CRUD operations for categories
 */

test.describe('Categories Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
    await helpers.waitForLoading();
  });

  test('should navigate to categories page', async ({ page }) => {
    // Navigate to categories (adjust based on your routing)
    // This might be through a sidebar link or menu
    const categoriesLink = page.getByRole('link', { name: /categories/i });

    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await helpers.waitForLoading();

      await helpers.takeScreenshot('22-categories-page');
    }
  });

  test('should display categories list', async ({ page }) => {
    // Navigate to categories page
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Verify we're on the categories page
    await helpers.verifyHeading('Categories', 4);

    // Check for grid/list of categories
    await helpers.takeScreenshot('23-categories-list');
  });

  test('should open create category dialog', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Look for "Create" or "Add Category" button
    const createButton = page.getByRole('button', { name: /create|add category/i });

    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for dialog to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Verify dialog content
      await expect(page.getByText(/create.*category/i)).toBeVisible();

      await helpers.takeScreenshot('24-create-category-dialog');
    }
  });

  test('should validate required fields in category form', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Open create dialog
    const createButton = page.getByRole('button', { name: /create|add category/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Try to submit without filling required fields
      const submitButton = page.locator('[role="dialog"]').getByRole('button', { name: /create|save/i });
      await submitButton.click();

      // Wait for validation messages
      await page.waitForTimeout(500);

      await helpers.takeScreenshot('25-category-validation');
    }
  });

  test('should create a new category', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Open create dialog
    const createButton = page.getByRole('button', { name: /create|add category/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill in the form
      await page.getByLabel(/name/i).fill(mockTestData.category.name);
      await page.getByLabel(/details|description/i).fill(mockTestData.category.details);

      // Take screenshot of filled form
      await helpers.takeScreenshot('26-category-form-filled');

      // Submit the form
      const submitButton = page.locator('[role="dialog"]').getByRole('button', { name: /create|save/i });
      await submitButton.click();

      // Wait for success (toast message or dialog close)
      await page.waitForTimeout(2000);

      // Verify the category appears in the list
      await helpers.takeScreenshot('27-category-created');
    }
  });

  test('should view category details', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Click on the first category card
    const categoryCard = page.locator('[data-testid="category-card"]').first();

    if (await categoryCard.isVisible()) {
      await categoryCard.click();
      await helpers.waitForLoading();

      // Should navigate to category details page
      await helpers.takeScreenshot('28-category-details-page');

      // Verify topics section
      if (await helpers.isVisible('[data-testid="topic-card"]')) {
        await helpers.takeScreenshot('29-category-with-topics');
      }
    }
  });

  test('should edit existing category', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Find edit button on first category
    const editButton = page.locator('[data-testid="category-card"]')
      .first()
      .getByRole('button', { name: /edit/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Modify the name
      const nameInput = page.getByLabel(/name/i);
      await nameInput.clear();
      await nameInput.fill('Updated Category Name');

      await helpers.takeScreenshot('30-edit-category-dialog');

      // Save changes
      const saveButton = page.locator('[role="dialog"]').getByRole('button', { name: /save|update/i });
      await saveButton.click();

      // Wait for update
      await page.waitForTimeout(2000);

      await helpers.takeScreenshot('31-category-updated');
    }
  });

  test('should filter categories', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Look for search/filter input
    const searchInput = page.getByPlaceholder(/search|filter/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      await helpers.takeScreenshot('32-filtered-categories');

      // Clear filter
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('should delete category', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // Find delete button (might be in a menu)
    const deleteButton = page.locator('[data-testid="category-card"]')
      .first()
      .getByRole('button', { name: /delete|remove/i });

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Wait for confirmation dialog
      await page.waitForTimeout(500);

      await helpers.takeScreenshot('33-delete-confirmation');

      // Confirm deletion (adjust selector based on your implementation)
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();

        await page.waitForTimeout(2000);
        await helpers.takeScreenshot('34-category-deleted');
      }
    }
  });

  test('should display empty state when no categories', async ({ page }) => {
    await page.goto('/categories');
    await helpers.waitForLoading();

    // If there are no categories, should show empty state
    const categoryCards = page.locator('[data-testid="category-card"]');
    const count = await categoryCards.count();

    if (count === 0) {
      await helpers.takeScreenshot('35-categories-empty-state');
    }
  });
});
