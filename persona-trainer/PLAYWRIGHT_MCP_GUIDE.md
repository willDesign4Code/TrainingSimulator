# Playwright MCP Integration Guide

## What is Playwright MCP?

The Playwright Model Context Protocol (MCP) server allows Claude Code to interact with Playwright for enhanced visual testing and browser automation capabilities.

## Installation

To add the Playwright MCP server to Claude Code, run:

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

This command configures Claude Code to use the Playwright MCP server, enabling:

- **Visual page reviews**: Ask Claude to review and analyze screenshots of your application
- **Automated testing**: Let Claude help write and debug E2E tests
- **Element inspection**: Get help finding the right selectors
- **Test debugging**: Analyze test failures with visual context

## What This Enables

### 1. Visual Page Analysis

You can ask Claude to:
- Review screenshots of your application pages
- Identify UI/UX issues
- Suggest accessibility improvements
- Validate responsive designs
- Compare before/after states

Example:
```
"Can you review the login page screenshot and suggest improvements?"
"Compare these two screenshots and tell me what changed"
"Does this page meet accessibility standards?"
```

### 2. Test Debugging with Visuals

Claude can:
- Analyze failed test screenshots
- Identify why elements aren't being found
- Suggest better selectors
- Debug visual regression failures

Example:
```
"This test is failing - here's the screenshot. What's wrong?"
"Help me find the right selector for this button"
```

### 3. Automated Test Generation

With visual context, Claude can:
- Write more accurate tests
- Choose appropriate selectors
- Suggest assertions based on UI
- Create comprehensive test scenarios

Example:
```
"Generate tests for this user flow based on these screenshots"
"Write a test to verify this form validation"
```

## How It Works

1. **MCP Server Setup**: The command adds Playwright MCP to your Claude Code configuration
2. **Browser Automation**: MCP server can launch browsers and capture screenshots
3. **Visual Analysis**: Screenshots are sent to Claude for analysis
4. **Actionable Feedback**: Claude provides insights and suggestions

## Usage Examples

### Reviewing Application Pages

```bash
# In Claude Code chat
"Take a screenshot of http://localhost:5173/login and review it"
"Navigate to the dashboard and capture screenshots of all tabs"
```

### Debugging Tests

```bash
# After a test failure
"Show me the screenshot from the failed test and explain what went wrong"
"Compare the expected vs actual screenshots from this visual regression test"
```

### Element Selection

```bash
"What's the best selector for the 'Create Category' button on this page?"
"Help me find accessible selectors for this form"
```

## Current Setup

### Without MCP

Currently, your tests use manual screenshots:

```typescript
await helpers.takeScreenshot('page-state');
```

Screenshots are saved to `e2e/screenshots/` and you can manually review them.

### With MCP

Once MCP is installed, you can:

1. **Share screenshots with Claude directly in chat**
2. **Get real-time feedback on UI**
3. **Debug tests with AI assistance**
4. **Automate visual reviews**

## Installation Steps

### Step 1: Install MCP

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

### Step 2: Verify Installation

The MCP server should now appear in your Claude Code settings under MCP servers.

### Step 3: Use in Claude Code

In the Claude Code chat, you can now:

```
"Open http://localhost:5173 and take a screenshot of the login page"
"Navigate through the training flow and capture key screens"
"Review the dashboard for accessibility issues"
```

## Benefits for Visual Testing

### 1. Faster Feedback Loop

- No need to manually review screenshots
- Get instant AI analysis
- Identify issues quickly

### 2. Better Test Coverage

- Claude can suggest test scenarios you might have missed
- Generate tests based on visual analysis
- Identify edge cases from UI exploration

### 3. Improved Selectors

- Get recommendations for stable selectors
- Learn best practices for element targeting
- Reduce test flakiness

### 4. Visual Regression Analysis

- AI-powered diff analysis
- Explanation of visual changes
- Suggestions for fixing issues

## Alternative: Manual Visual Testing

If you prefer not to use MCP, you can still do visual testing manually:

1. **Run tests and capture screenshots**:
   ```bash
   npm run test:e2e:headed
   ```

2. **Review screenshots** in `e2e/screenshots/`

3. **Share with Claude** by uploading screenshots in chat

4. **Get analysis** and suggestions

## Best Practices

### When Using MCP

1. **Use descriptive screenshot names** so Claude can understand context
2. **Capture key states** (before/after actions, error states, etc.)
3. **Provide context** when asking for analysis
4. **Iterate quickly** with AI feedback

### Screenshot Organization

```
e2e/screenshots/
├── 01-login-page.png
├── 02-login-validation.png
├── 03-dashboard-overview.png
├── 04-category-list.png
└── ...
```

Numbered and descriptive names help with:
- Chronological review
- Understanding test flow
- Sharing with team/AI

## Troubleshooting

### MCP Server Not Found

Ensure you ran the installation command:
```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

### Can't Connect to Dev Server

Make sure your dev server is running:
```bash
npm run dev
```

Then ask Claude to navigate to `http://localhost:5173`

### Screenshots Not Captured

Check that the screenshots directory exists:
```bash
mkdir -p e2e/screenshots
```

## Next Steps

1. **Install MCP** using the command above
2. **Start your dev server**: `npm run dev`
3. **Ask Claude to review your pages**
4. **Use feedback to improve UI and tests**

## Resources

- [Playwright MCP Documentation](https://github.com/microsoft/playwright-mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [Playwright Documentation](https://playwright.dev/)

---

**Note**: The MCP server is separate from the Playwright testing framework. You can use Playwright tests without MCP, but MCP enhances the experience by enabling AI-assisted visual testing and analysis.
