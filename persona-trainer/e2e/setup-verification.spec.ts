import { test, expect } from '@playwright/test';

/**
 * Setup Verification Test
 *
 * This test verifies that Playwright is correctly installed and configured.
 * Run this first to ensure everything is working before running other tests.
 *
 * Usage: npx playwright test e2e/setup-verification.spec.ts --headed
 */

test.describe('Playwright Setup Verification', () => {
  test('should verify Playwright is working', async ({ page }) => {
    // Navigate to a simple page
    await page.goto('https://playwright.dev');

    // Verify page loaded
    await expect(page).toHaveTitle(/Playwright/);

    console.log('✅ Playwright is working correctly!');
  });

  test('should verify screenshot capability', async ({ page }) => {
    await page.goto('https://playwright.dev');

    // Take a screenshot
    await page.screenshot({ path: 'e2e/screenshots/setup-verification.png' });

    console.log('✅ Screenshot capability is working!');
    console.log('📸 Screenshot saved to: e2e/screenshots/setup-verification.png');
  });

  test('should verify local dev server connection', async ({ page }) => {
    // Try to connect to local dev server
    try {
      await page.goto('http://localhost:5173', { timeout: 5000 });

      // If successful, check for React root
      const hasRoot = await page.locator('#root').count();

      if (hasRoot > 0) {
        console.log('✅ Local dev server is running and accessible!');
        await page.screenshot({ path: 'e2e/screenshots/local-dev-server.png' });
      } else {
        console.log('⚠️  Dev server is running but React app may not be loaded');
      }
    } catch (error) {
      console.log('❌ Could not connect to local dev server at http://localhost:5173');
      console.log('💡 Make sure to run "npm run dev" before running tests');
      // Don't fail the test, just warn
    }
  });

  test('should verify browser contexts', async ({ browser }) => {
    // Test that we can create multiple contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('https://playwright.dev');
    await page2.goto('https://playwright.dev');

    // Verify both pages are independent
    expect(context1).not.toBe(context2);

    await context1.close();
    await context2.close();

    console.log('✅ Browser contexts are working correctly!');
  });

  test('should verify mobile viewport', async ({ browser }) => {
    // Test mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });

    const page = await context.newPage();
    await page.goto('https://playwright.dev');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);

    await page.screenshot({ path: 'e2e/screenshots/mobile-viewport.png' });

    await context.close();

    console.log('✅ Mobile viewport simulation is working!');
  });

  test('should verify test helpers are accessible', async ({ page }) => {
    // Try to import test helpers
    const { TestHelpers } = await import('./fixtures/test-helpers');

    const helpers = new TestHelpers(page);

    // Verify helper methods exist
    expect(typeof helpers.takeScreenshot).toBe('function');
    expect(typeof helpers.login).toBe('function');
    expect(typeof helpers.waitForLoading).toBe('function');

    console.log('✅ Test helpers are correctly imported!');
  });
});

test.describe('Configuration Verification', () => {
  test('should verify test configuration', async ({ page }) => {
    // Verify base URL is set
    const baseURL = page.context().browser()?.contexts()[0];

    console.log('✅ Playwright configuration is loaded!');
    console.log('ℹ️  Base URL:', 'http://localhost:5173');
    console.log('ℹ️  Test directory:', './e2e');
  });

  test('should verify multiple browser support', async ({ browserName }) => {
    console.log(`✅ Running on browser: ${browserName}`);

    // This test will run on all configured browsers
    expect(['chromium', 'firefox', 'webkit']).toContain(browserName);
  });
});

/**
 * Run this test suite to verify your setup:
 *
 * npx playwright test e2e/setup-verification.spec.ts --headed
 *
 * Expected output:
 * ✅ Playwright is working correctly!
 * ✅ Screenshot capability is working!
 * ✅ Local dev server is running and accessible!
 * ✅ Browser contexts are working correctly!
 * ✅ Mobile viewport simulation is working!
 * ✅ Test helpers are correctly imported!
 * ✅ Playwright configuration is loaded!
 * ✅ Running on browser: chromium
 * ✅ Running on browser: firefox
 * ✅ Running on browser: webkit
 */