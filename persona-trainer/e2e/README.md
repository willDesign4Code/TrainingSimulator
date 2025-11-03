# E2E Tests

End-to-end tests for the Training Simulator application using Playwright.

## Quick Start

```bash
# Run all tests
npm run test:e2e

# Run with UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View report
npm run test:e2e:report
```

## Test Files

- `auth.spec.ts` - Authentication and login flow
- `dashboard.spec.ts` - Dashboard navigation and display
- `categories.spec.ts` - Category CRUD operations
- `training-flow.spec.ts` - Training session workflow

## Helper Functions

See `fixtures/test-helpers.ts` for reusable test utilities:

- `login()` - Authenticate user
- `takeScreenshot(name)` - Capture page state
- `waitForLoading()` - Wait for async operations
- `verifyHeading(text)` - Check page headings
- And more...

## Screenshots

All screenshots are saved to `screenshots/` directory with descriptive names. These help with:
- Visual debugging
- Documentation
- Visual regression testing

## Writing New Tests

1. Import required dependencies
2. Use `TestHelpers` for common operations
3. Take screenshots at key states
4. Use descriptive test names
5. Keep tests independent

Example:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

test.describe('My Feature', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test('should do something', async ({ page }) => {
    await page.goto('/my-feature');
    await helpers.takeScreenshot('initial-state');

    // Your test logic here

    await helpers.takeScreenshot('final-state');
  });
});
```

## Before Running Tests

**Important**: Make sure you have test data set up in your Supabase database:

- At least one test user account
- Sample categories, topics, scenarios
- Test personas and rubrics

You can use the authentication credentials in `fixtures/test-helpers.ts` (currently set to `test@example.com` / `password123`).

Update these credentials to match your test environment.

## Visual Testing

Screenshots are automatically captured at key points in tests. To enable visual regression testing:

1. Run tests once to create baseline screenshots
2. On subsequent runs, Playwright compares against baselines
3. Update baselines when UI changes are intentional:

```bash
npx playwright test --update-snapshots
```

## CI/CD

Tests are configured to:
- Run with 2 retries in CI
- Use single worker in CI
- Generate HTML reports
- Capture videos on failure
- Save traces for debugging

See `playwright.config.ts` for full configuration.

## Need Help?

See the full guide: [E2E_TESTING_GUIDE.md](../E2E_TESTING_GUIDE.md)
