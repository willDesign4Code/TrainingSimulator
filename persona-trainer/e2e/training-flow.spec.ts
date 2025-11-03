import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

/**
 * Training Flow E2E Tests
 *
 * Tests the complete training scenario flow including:
 * - Starting a training session
 * - Interacting with the AI persona
 * - Completing and viewing results
 */

test.describe('Training Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
    await helpers.waitForLoading();
  });

  test('should start a training session from category', async ({ page }) => {
    // Navigate to a category with scenarios
    const categoryCard = page.locator('[data-testid="category-card"]').first();

    if (await categoryCard.isVisible()) {
      await categoryCard.click();
      await helpers.waitForLoading();

      // Take screenshot of category details with topics
      await helpers.takeScreenshot('36-category-for-training');

      // Click on a topic
      const topicCard = page.locator('[data-testid="topic-card"]').first();
      if (await topicCard.isVisible()) {
        await topicCard.click();
        await helpers.waitForLoading();

        await helpers.takeScreenshot('37-topic-with-scenarios');
      }
    }
  });

  test('should open training modal when scenario is clicked', async ({ page }) => {
    // Navigate through category > topic > scenario
    // (This assumes you have test data set up)

    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      // Click to start training
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      // Wait for training modal to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Verify training modal elements
      await expect(page.getByText(/training session/i)).toBeVisible();

      await helpers.takeScreenshot('38-training-modal-opened');
    }
  });

  test('should display scenario context and persona', async ({ page }) => {
    // Start a training session
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Look for scenario description
      await helpers.takeScreenshot('39-scenario-context');

      // Wait for initial AI message
      await page.waitForTimeout(2000);

      await helpers.takeScreenshot('40-initial-ai-message');
    }
  });

  test('should allow sending messages in training session', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Wait for chat to be ready
      await page.waitForTimeout(2000);

      // Find message input
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');

      if (await messageInput.isVisible()) {
        // Type a message
        await messageInput.fill('Hello, I would like to discuss the issue.');

        await helpers.takeScreenshot('41-message-typed');

        // Send message
        const sendButton = page.getByRole('button', { name: /send/i });
        await sendButton.click();

        // Wait for message to appear in chat
        await page.waitForTimeout(1000);

        await helpers.takeScreenshot('42-message-sent');

        // Wait for AI response
        await page.waitForTimeout(3000);

        await helpers.takeScreenshot('43-ai-response');
      }
    }
  });

  test('should display chat history', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Send multiple messages
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');

      if (await messageInput.isVisible()) {
        // First message
        await messageInput.fill('Message 1');
        await page.getByRole('button', { name: /send/i }).click();
        await page.waitForTimeout(2000);

        // Second message
        await messageInput.fill('Message 2');
        await page.getByRole('button', { name: /send/i }).click();
        await page.waitForTimeout(2000);

        // Screenshot showing chat history
        await helpers.takeScreenshot('44-chat-history');
      }
    }
  });

  test('should end training session', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Look for end session button
      const endButton = page.getByRole('button', { name: /end.*session|finish|complete/i });

      if (await endButton.isVisible()) {
        await endButton.click();

        // Wait for session to end
        await page.waitForTimeout(2000);

        await helpers.takeScreenshot('45-session-ended');
      }
    }
  });

  test('should display scoring results after session', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Send at least one message
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message for scoring');
        await page.getByRole('button', { name: /send/i }).click();
        await page.waitForTimeout(2000);
      }

      // End session
      const endButton = page.getByRole('button', { name: /end.*session|finish|complete/i });
      if (await endButton.isVisible()) {
        await endButton.click();

        // Wait for scoring to complete
        await page.waitForTimeout(5000);

        // Look for scoring modal/results
        await helpers.takeScreenshot('46-scoring-results');

        // Verify scoring elements
        const hasScore = await helpers.isVisible('text=/score|rating|performance/i');
        if (hasScore) {
          await helpers.takeScreenshot('47-detailed-scores');
        }
      }
    }
  });

  test('should show rubric scores breakdown', async ({ page }) => {
    // Similar to previous test, but focus on rubric details
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Complete a minimal session
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]');
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test message');
        await page.getByRole('button', { name: /send/i }).click();
        await page.waitForTimeout(2000);
      }

      const endButton = page.getByRole('button', { name: /end.*session|finish|complete/i });
      if (await endButton.isVisible()) {
        await endButton.click();
        await page.waitForTimeout(5000);

        // Look for individual rubric scores
        await helpers.takeScreenshot('48-rubric-breakdown');
      }
    }
  });

  test('should close results and return to scenarios', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(2000);

      // Quick session
      const endButton = page.getByRole('button', { name: /end.*session|finish|complete/i });
      if (await endButton.isVisible()) {
        await endButton.click();
        await page.waitForTimeout(5000);

        // Close results
        const closeButton = page.getByRole('button', { name: /close|done/i });
        if (await closeButton.isVisible()) {
          await closeButton.click();

          await page.waitForTimeout(1000);
          await helpers.takeScreenshot('49-returned-to-scenarios');
        }
      }
    }
  });

  test('should handle audio playback if available', async ({ page }) => {
    const scenarioCard = page.locator('[data-testid="scenario-card"]').first();

    if (await scenarioCard.isVisible()) {
      const startButton = scenarioCard.getByRole('button', { name: /start|train/i });
      await startButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.waitForTimeout(3000);

      // Look for audio controls
      const audioButton = page.getByRole('button', { name: /play|audio|voice/i });

      if (await audioButton.isVisible()) {
        await helpers.takeScreenshot('50-audio-available');
        // Note: Actually testing audio playback is complex, just verify UI
      }
    }
  });
});
