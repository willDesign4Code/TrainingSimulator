import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions for E2E Tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login helper function
   */
  async login(email: string = 'test@example.com', password: string = 'password123') {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');

    // Wait for navigation to complete
    await this.page.waitForURL('/');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for loading indicators to disappear
   */
  async waitForLoading() {
    await this.page.waitForLoadState('networkidle');
    // Wait for any circular progress indicators to disappear
    await this.page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 10000 }).catch(() => {
      // Ignore if no progress bar is found
    });
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Fill form field by label
   */
  async fillByLabel(label: string, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Click button by text
   */
  async clickButton(text: string) {
    await this.page.getByRole('button', { name: new RegExp(text, 'i') }).click();
  }

  /**
   * Verify page title
   */
  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }

  /**
   * Verify heading text
   */
  async verifyHeading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1) {
    const heading = this.page.getByRole('heading', { level, name: new RegExp(text, 'i') });
    await expect(heading).toBeVisible();
  }

  /**
   * Wait for toast/snackbar message
   */
  async waitForToast(message?: string) {
    const toast = this.page.locator('[role="alert"]');
    await expect(toast).toBeVisible({ timeout: 5000 });

    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  /**
   * Close any open dialogs
   */
  async closeDialog() {
    const closeButton = this.page.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

/**
 * Mock data for testing
 */
export const mockTestData = {
  user: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  category: {
    name: 'E2E Test Category',
    details: 'This is a test category created during E2E testing',
  },
  persona: {
    name: 'Test Persona',
    age: '30',
    occupation: 'Software Engineer',
    pronoun: 'they/them',
    interests: 'coding, testing',
    goals: 'Complete E2E tests successfully',
    challenges: 'Finding all the bugs',
  },
  topic: {
    name: 'E2E Test Topic',
    details: 'Test topic for E2E testing',
  },
};
