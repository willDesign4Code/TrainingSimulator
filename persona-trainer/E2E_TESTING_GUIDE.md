# E2E Testing Guide - Training Simulator

This guide covers end-to-end (E2E) testing for the Training Simulator application using Playwright.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Visual Testing](#visual-testing)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Our E2E tests are built with [Playwright](https://playwright.dev/), a powerful testing framework that enables:

- **Cross-browser testing**: Test on Chromium, Firefox, and WebKit
- **Visual validation**: Automatic screenshots and visual regression testing
- **Mobile testing**: Test responsive designs on mobile viewports
- **Network mocking**: Intercept and mock API calls
- **Video recording**: Capture videos of test failures
- **Trace viewer**: Debug tests with detailed execution traces

## Installation

Playwright is already installed as a dev dependency. If you need to reinstall browsers:

```bash
npx playwright install
```

To install specific browsers:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

## Running Tests

### All Tests (Headless Mode)

```bash
npm run test:e2e
```

### Interactive UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

The UI mode provides:
- Visual test runner
- Step-by-step debugging
- Time travel through test execution
- Watch mode for test development

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Run Specific Browser

```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### View Test Report

```bash
npm run test:e2e:report
```

### Run Specific Test File

```bash
npx playwright test e2e/auth.spec.ts
```

### Run Specific Test by Name

```bash
npx playwright test -g "should display login page"
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

test.describe('Feature Name', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Setup code (e.g., login)
    await helpers.login();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();

    // Screenshot
    await helpers.takeScreenshot('feature-state');
  });
});
```

### Using Test Helpers

The `TestHelpers` class provides common utilities:

```typescript
// Login
await helpers.login('user@example.com', 'password');

// Take screenshots
await helpers.takeScreenshot('descriptive-name');

// Wait for loading
await helpers.waitForLoading();

// Fill forms
await helpers.fillByLabel('Name', 'John Doe');

// Click buttons
await helpers.clickButton('Submit');

// Verify headings
await helpers.verifyHeading('Page Title', 1);

// Wait for toast messages
await helpers.waitForToast('Success!');
```

### Locating Elements

Playwright recommends using user-facing attributes:

```typescript
// By role (preferred)
page.getByRole('button', { name: /submit/i })
page.getByRole('heading', { name: 'Title' })
page.getByRole('textbox', { name: 'Email' })

// By label
page.getByLabel('Email Address')

// By placeholder
page.getByPlaceholder('Enter your email')

// By test ID (when necessary)
page.locator('[data-testid="category-card"]')

// By text
page.getByText('Welcome')
```

### Common Actions

```typescript
// Click
await page.getByRole('button', { name: /submit/i }).click();

// Fill input
await page.fill('input[name="email"]', 'test@example.com');

// Select option
await page.selectOption('select[name="role"]', 'admin');

// Check checkbox
await page.check('input[type="checkbox"]');

// Upload file
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');

// Hover
await page.hover('.menu-item');

// Press keys
await page.press('input[name="search"]', 'Enter');
```

### Assertions

```typescript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Hidden')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toContainText('Dashboard');
await expect(page.getByRole('heading')).toHaveText('Exact Text');

// Count
await expect(page.getByTestId('card')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/category\/\d+/);

// Attributes
await expect(page.locator('button')).toHaveAttribute('disabled', '');
await expect(page.locator('input')).toHaveValue('expected value');

// Screenshots
await expect(page).toHaveScreenshot('expected.png');
```

## Visual Testing

### Taking Screenshots

Our tests automatically capture screenshots at key points:

```typescript
await helpers.takeScreenshot('feature-name-state');
```

Screenshots are saved to `e2e/screenshots/` with descriptive names.

### Screenshot Assertions (Visual Regression)

```typescript
// Compare with baseline
await expect(page).toHaveScreenshot('login-page.png');

// Compare specific element
await expect(page.locator('.dashboard')).toHaveScreenshot('dashboard.png');

// With threshold (allow 1% difference)
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixelRatio: 0.01,
});
```

**First Run**: Playwright captures baseline screenshots
**Subsequent Runs**: Compares against baseline and fails if differences exceed threshold

### Updating Baselines

```bash
npx playwright test --update-snapshots
```

### Visual Debugging

When tests fail, Playwright generates:
- **Actual screenshot**: What the page looked like
- **Expected screenshot**: The baseline
- **Diff image**: Highlights differences

View these in the HTML report:

```bash
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── fixtures/
│   └── test-helpers.ts       # Reusable test utilities
├── screenshots/              # Auto-generated screenshots
├── auth.spec.ts              # Authentication tests
├── dashboard.spec.ts         # Dashboard tests
├── categories.spec.ts        # Category CRUD tests
└── training-flow.spec.ts     # Training session tests
```

## Current Test Coverage

### Authentication (`auth.spec.ts`)
- ✅ Login page display
- ✅ Form validation
- ✅ Invalid credentials handling
- ✅ Successful login
- ✅ Protected route redirects
- ✅ Logout
- ✅ Session persistence

### Dashboard (`dashboard.spec.ts`)
- ✅ Layout and navigation
- ✅ Tab switching
- ✅ Assigned categories display
- ✅ Training scenarios table
- ✅ Mobile responsiveness

### Categories (`categories.spec.ts`)
- ✅ Categories list
- ✅ Create category
- ✅ Form validation
- ✅ Edit category
- ✅ Delete category
- ✅ Category details
- ✅ Filtering

### Training Flow (`training-flow.spec.ts`)
- ✅ Start training session
- ✅ Chat interaction
- ✅ Message sending/receiving
- ✅ Session completion
- ✅ Scoring results
- ✅ Rubric breakdown

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// Good
test('should display validation error when email is invalid', async ({ page }) => {

// Bad
test('test email', async ({ page }) => {
```

### 2. Use User-Facing Selectors

```typescript
// Good
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email Address')

// Avoid
page.locator('button.submit-btn')
page.locator('#email-input')
```

### 3. Wait for Actions to Complete

```typescript
// Good
await page.click('button');
await page.waitForURL('/dashboard');

// Bad
await page.click('button');
// Immediately checking without waiting
```

### 4. Keep Tests Independent

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests

### 5. Use beforeEach for Common Setup

```typescript
test.beforeEach(async ({ page }) => {
  await helpers.login();
  await page.goto('/categories');
});
```

### 6. Take Screenshots for Important States

```typescript
await helpers.takeScreenshot('before-action');
await page.click('button');
await helpers.takeScreenshot('after-action');
```

### 7. Handle Conditional UI

```typescript
// Check if element exists before interacting
if (await page.getByRole('button', { name: /close/i }).isVisible()) {
  await page.getByRole('button', { name: /close/i }).click();
}
```

### 8. Use Test Data Constants

```typescript
import { mockTestData } from './fixtures/test-helpers';

await page.fill('input[name="name"]', mockTestData.category.name);
```

## Troubleshooting

### Tests Timing Out

Increase timeout for specific test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

Or in config:

```typescript
// playwright.config.ts
use: {
  actionTimeout: 15000,
  navigationTimeout: 30000,
}
```

### Element Not Found

1. Check if element is in viewport
2. Wait for element to appear
3. Use `page.waitForSelector()`

```typescript
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
```

### Flaky Tests

Common causes:
- Network delays
- Animation timing
- Race conditions

Solutions:
- Use `waitForLoadState('networkidle')`
- Increase timeouts
- Add explicit waits
- Disable animations in test mode

### Tests Pass Locally but Fail in CI

- Ensure consistent viewport size
- Check for timing issues
- Verify CI environment has necessary resources
- Use `retries` in CI:

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
```

### Debugging Failed Tests

1. **Run in headed mode**:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode**:
   ```bash
   npm run test:e2e:debug
   ```

3. **View trace**:
   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Check screenshots**:
   - Located in `test-results/` folder
   - View in HTML report

### Visual Regression Failures

If visual tests fail unexpectedly:

1. Check the diff in the HTML report
2. Verify if change is intentional
3. Update baselines if needed:
   ```bash
   npx playwright test --update-snapshots
   ```

## Adding New Tests

1. **Create test file** in `e2e/` directory:
   ```bash
   touch e2e/new-feature.spec.ts
   ```

2. **Import dependencies**:
   ```typescript
   import { test, expect } from '@playwright/test';
   import { TestHelpers } from './fixtures/test-helpers';
   ```

3. **Write test suite**:
   ```typescript
   test.describe('New Feature', () => {
     // tests here
   });
   ```

4. **Run your test**:
   ```bash
   npx playwright test e2e/new-feature.spec.ts
   ```

## CI/CD Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Next Steps

1. **Add more test coverage** for:
   - Personas management
   - Topics CRUD
   - Scenarios CRUD
   - Assignments flow
   - Admin features

2. **Set up visual regression testing** for critical pages

3. **Integrate with CI/CD** pipeline

4. **Add performance testing** using Playwright's timing APIs

5. **Implement API mocking** for more reliable tests

---

**Note**: Before running tests, ensure your dev server is running or the tests will start it automatically. For best results, use a test database separate from your development database.
