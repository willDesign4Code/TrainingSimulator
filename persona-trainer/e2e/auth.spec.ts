import { test, expect } from '@playwright/test';
import { TestHelpers, mockTestData } from './fixtures/test-helpers';

/**
 * Authentication Flow E2E Tests
 *
 * Tests login, logout, and authentication state persistence
 */

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Verify login page elements
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Take screenshot of login page
    await helpers.takeScreenshot('01-login-page');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for validation errors (if implemented)
    await page.waitForTimeout(500);

    // Take screenshot of validation state
    await helpers.takeScreenshot('02-login-validation');
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Take screenshot showing error
    await helpers.takeScreenshot('03-login-error');
  });

  test('should successfully login and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', mockTestData.user.email);
    await page.fill('input[type="password"]', mockTestData.user.password);

    // Take screenshot before login
    await helpers.takeScreenshot('04-before-login');

    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/', { timeout: 10000 });

    // Verify we're on the dashboard
    await helpers.verifyHeading('My Dashboard', 4);

    // Take screenshot of dashboard
    await helpers.takeScreenshot('05-dashboard-after-login');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 5000 });

    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

    await helpers.takeScreenshot('06-protected-route-redirect');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await helpers.login();
    await helpers.waitForLoading();

    // Take screenshot of logged in state
    await helpers.takeScreenshot('07-logged-in-state');

    // Find and click logout button (adjust selector based on your implementation)
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login
      await page.waitForURL('/login', { timeout: 5000 });

      await helpers.takeScreenshot('08-after-logout');
    }
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await helpers.login();
    await helpers.waitForLoading();

    // Reload the page
    await page.reload();
    await helpers.waitForLoading();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/');
    await helpers.verifyHeading('My Dashboard', 4);

    await helpers.takeScreenshot('09-persisted-auth');
  });
});
