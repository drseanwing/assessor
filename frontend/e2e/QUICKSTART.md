# Playwright E2E Tests - Quick Start

## Setup (First Time Only)

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with interactive UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed
```

## Running Specific Tests

```bash
# Run only auth tests
npx playwright test e2e/auth.spec.ts

# Run only dashboard tests
npx playwright test e2e/dashboard.spec.ts

# Run only assessment tests
npx playwright test e2e/assessment.spec.ts

# Run specific test by name
npx playwright test -g "should successfully login"
```

## Debugging

```bash
# Debug mode (step through tests)
npx playwright test --debug

# Debug specific test
npx playwright test e2e/auth.spec.ts --debug

# Run with trace
npx playwright test --trace on
```

## Viewing Results

```bash
# View HTML report (after tests run)
npx playwright show-report

# View trace (for failed tests)
npx playwright show-trace trace.zip
```

## Before Running Tests

Ensure:
1. Backend server is running
2. Database is connected and seeded with test data:
   - At least one active assessor
   - At least one course with current date
   - At least one participant in the course
   - Template components and outcomes configured

## Test Coverage

✅ **auth.spec.ts** (10 tests)
- Login page display
- PIN validation
- Login flow
- Authentication state

✅ **dashboard.spec.ts** (15 tests)
- Course listing
- Date filtering
- Navigation
- Logout

✅ **assessment.spec.ts** (16 tests)
- Participant navigation
- Assessment workflow
- Outcome scoring
- Feedback entry
- Real-time indicators

**Total: 41 end-to-end tests**

## Common Issues

### "Cannot find module"
```bash
npm install
```

### "Browser not found"
```bash
npx playwright install
```

### "Connection refused"
Make sure dev server is running:
```bash
npm run dev
```

### Tests timeout
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 60000, // 60 seconds
```

## Configuration

Edit `playwright.config.ts` to:
- Change base URL
- Adjust timeout values
- Enable/disable browsers
- Configure retries
- Set up video recording
