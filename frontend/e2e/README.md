# REdI Assessment E2E Tests

This directory contains end-to-end tests for the REdI Assessment frontend using Playwright.

## Test Files

- **auth.spec.ts** - Authentication and login flow tests
- **dashboard.spec.ts** - Course list and dashboard display tests
- **assessment.spec.ts** - Full assessment workflow tests (navigate, score outcomes, add feedback)
- **helpers.ts** - Reusable helper functions for tests

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Ensure backend services are running and database is seeded with test data

### Run Commands

```bash
# Run all tests in headless mode
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug mode
npx playwright test --debug
```

## Test Structure

### Authentication Tests (`auth.spec.ts`)
- Login page display
- Assessor dropdown population
- PIN validation (length and numeric-only)
- Successful login flow
- Redirect when already authenticated
- Loading states

### Dashboard Tests (`dashboard.spec.ts`)
- Course list display
- Date filtering
- Course details display
- Navigation to participant list
- Navigation to course dashboard
- Logout functionality
- Empty states

### Assessment Tests (`assessment.spec.ts`)
- Navigate to participant list
- Search participants
- Navigate to assessment page
- Display assessment components
- Score outcomes with Bondy scale
- Switch between component tabs
- Add component feedback
- Set engagement score
- Add overall feedback
- Save and sync indicators

## Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: http://localhost:5173 (Vite dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Timeout**: 30 seconds default
- **Retries**: 2 on CI, 0 locally
- **Web Server**: Automatically starts dev server before tests

## Test Data Requirements

Tests expect the database to be seeded with:
- At least one active assessor (for login)
- At least one course (for navigation tests)
- At least one participant in a course (for assessment tests)
- Template components and outcomes (for assessment scoring)

## Debugging

### View Test Report
```bash
npx playwright show-report
```

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure
Screenshots are automatically captured on test failures and saved to `test-results/`.

### Video Recording
Enable video recording in `playwright.config.ts`:
```typescript
use: {
  video: 'on-first-retry',
}
```

## Best Practices

1. **Data Independence**: Tests check if data exists before interacting
2. **Waits**: Use explicit waits for loading states
3. **Selectors**: Use semantic selectors (text, roles) over CSS when possible
4. **Cleanup**: Tests don't create data that needs cleanup (read-only assessments)
5. **Parallel Execution**: Tests can run in parallel safely

## Known Limitations

- Tests assume development mode where any 4-digit PIN works
- Tests are designed for happy paths and don't extensively test error conditions
- Some tests may skip assertions if test data is not available
- Timing-dependent tests use generous waits to avoid flakiness

## CI/CD Integration

To run in CI:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Troubleshooting

### Test Timeouts
- Increase timeout in `playwright.config.ts`
- Check backend/database connectivity
- Verify dev server starts correctly

### Element Not Found
- Check if test data exists
- Verify selectors match current UI
- Add explicit waits for dynamic content

### Flaky Tests
- Increase wait times for data loading
- Check for race conditions
- Use `waitForLoadComplete()` helper

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
