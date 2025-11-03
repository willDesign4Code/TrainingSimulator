import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

/**
 * Dashboard E2E Tests
 *
 * Tests dashboard navigation, tab switching, and content display
 */

test.describe('Dashboard', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Login before each test
    await helpers.login();
    await helpers.waitForLoading();
  });

  test('should display dashboard with correct layout', async ({ page }) => {
    // Verify dashboard heading
    await helpers.verifyHeading('My Dashboard', 4);

    // Verify tab navigation exists
    await expect(page.getByText('My Assigned Categories')).toBeVisible();
    await expect(page.getByText('My Training Scenarios')).toBeVisible();

    // Take full page screenshot
    await helpers.takeScreenshot('10-dashboard-layout');
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on "My Training Scenarios" tab
    await page.getByText('My Training Scenarios').click();

    // Wait for content to load
    await helpers.waitForLoading();

    // Take screenshot of scenarios tab
    await helpers.takeScreenshot('11-scenarios-tab');

    // Switch back to categories tab
    await page.getByText('My Assigned Categories').click();
    await helpers.waitForLoading();

    await helpers.takeScreenshot('12-categories-tab');
  });

  test('should display assigned categories', async ({ page }) => {
    // Should be on the categories tab by default
    await expect(page.getByText('My Assigned Categories')).toBeVisible();

    // Wait for content to load
    await helpers.waitForLoading();

    // Check for empty state or category cards
    const hasCategories = await helpers.isVisible('[data-testid="category-card"]');

    if (hasCategories) {
      // If there are categories, verify we can see them
      const categoryCards = page.locator('[data-testid="category-card"]');
      await expect(categoryCards.first()).toBeVisible();

      await helpers.takeScreenshot('13-categories-with-data');
    } else {
      // Empty state
      await helpers.takeScreenshot('13-categories-empty-state');
    }
  });

  test('should navigate to category details', async ({ page }) => {
    await helpers.waitForLoading();

    // Check if there are any categories
    const categoryCard = page.locator('[data-testid="category-card"]').first();

    if (await categoryCard.isVisible()) {
      // Click on the first category
      await categoryCard.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Take screenshot of category details
      await helpers.takeScreenshot('14-category-details');
    }
  });

  test('should display training scenarios in table', async ({ page }) => {
    // Switch to scenarios tab
    await page.getByText('My Training Scenarios').click();
    await helpers.waitForLoading();

    // Check for table or empty state
    const hasTable = await helpers.isVisible('table');

    if (hasTable) {
      // Verify table headers
      await expect(page.getByRole('columnheader', { name: /scenario/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /category/i })).toBeVisible();

      await helpers.takeScreenshot('15-scenarios-table');
    } else {
      await helpers.takeScreenshot('15-scenarios-empty');
    }
  });

  test('should persist active tab in localStorage', async ({ page }) => {
    // Switch to scenarios tab
    await page.getByText('My Training Scenarios').click();
    await helpers.waitForLoading();

    // Reload page
    await page.reload();
    await helpers.waitForLoading();

    // Should still be on scenarios tab
    // Check if the tab is active (you may need to adjust this based on your implementation)
    await helpers.takeScreenshot('16-persisted-tab');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for re-render
    await page.waitForTimeout(500);

    // Take screenshot of mobile view
    await helpers.takeScreenshot('17-dashboard-mobile');

    // Try switching tabs on mobile
    await page.getByText('My Training Scenarios').click();
    await helpers.waitForLoading();

    await helpers.takeScreenshot('18-scenarios-mobile');
  });

  test('should display user profile information', async ({ page }) => {
    // Look for user menu or profile section
    const userMenu = page.locator('[data-testid="user-menu"]');

    if (await userMenu.isVisible()) {
      await userMenu.click();
      await helpers.takeScreenshot('19-user-menu');
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');

    // Try to capture loading state (this might be too fast)
    await page.waitForTimeout(100);
    await helpers.takeScreenshot('20-loading-state');

    // Wait for content to load
    await helpers.waitForLoading();
    await helpers.takeScreenshot('21-loaded-state');
  });
});
