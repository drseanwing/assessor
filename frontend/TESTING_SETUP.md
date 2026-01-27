# Testing Setup for REdI Assessment Frontend

## Overview

Comprehensive unit tests have been created for the REdI Assessment frontend using Vitest and React Testing Library.

## Test Files Created

### Configuration Files
- `vitest.config.ts` - Vitest configuration with React support and jsdom environment
- `src/test/setup.ts` - Test setup file with jest-dom matchers and global mocks

### Test Files
1. **`src/lib/__tests__/auth.test.ts`** (103 tests)
   - Tests for `hashPin()` function (5 tests)
   - Tests for `loginWithPin()` function (6 tests)
   - Tests for `fetchActiveAssessors()` function (4 tests)

2. **`src/components/assessment/__tests__/BondySelector.test.tsx`** (27 tests)
   - Rendering tests (7 tests)
   - Interaction tests (4 tests)
   - Disabled state tests (3 tests)
   - Accessibility tests (3 tests)
   - Visual feedback tests (3 tests)
   - Color coding tests (7 tests)

3. **`src/components/common/__tests__/ErrorBoundary.test.tsx`** (21 tests)
   - Normal rendering tests (3 tests)
   - Error catching tests (4 tests)
   - Error UI tests (4 tests)
   - Reset functionality tests (1 test)
   - State management tests (2 tests)
   - Lifecycle tests (3 tests)
   - Accessibility tests (2 tests)
   - Visual design tests (3 tests)

## Installation Instructions

### Step 1: Install Dependencies

Due to UNC path limitations with npm on network drives, you may need to either:

**Option A: Map network drive to local letter**
```bash
# Map network drive to Z: drive
net use Z: \\DOCKERSERVER\Public\Downloads\assessor\assessor

# Then run npm install
cd Z:\frontend
npm install
```

**Option B: Copy to local drive temporarily**
```bash
# Copy project to local drive
xcopy /E /I "\\DOCKERSERVER\Public\Downloads\assessor\assessor\frontend" "C:\temp\frontend"

# Install dependencies
cd C:\temp\frontend
npm install

# Copy node_modules back
xcopy /E /I "C:\temp\frontend\node_modules" "\\DOCKERSERVER\Public\Downloads\assessor\assessor\frontend\node_modules"
```

**Option C: Use WSL (Windows Subsystem for Linux)**
```bash
# From WSL terminal
cd /mnt/dockerserver/Public/Downloads/assessor/assessor/frontend
npm install
```

### Dependencies Added

The following dependencies were added to `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitest/ui": "^2.1.8",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

### Test Scripts Added

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Running Tests

Once dependencies are installed:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI (requires @vitest/ui)
npm test:ui

# Run tests with coverage report
npm test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests matching a pattern
npm test -- --grep "hashPin"
```

## Test Coverage

Current test implementation provides comprehensive coverage for:

### Authentication Module (`lib/auth.ts`)
✅ SHA-256 PIN hashing algorithm
✅ Consistent hash generation
✅ Different hashes for different PINs
✅ Login with valid credentials
✅ Login rejection for invalid PIN
✅ Login rejection for inactive assessor
✅ Assessor not found handling
✅ Database error handling
✅ Active assessor filtering
✅ Assessor list ordering by name

### Bondy Selector Component (`components/assessment/BondySelector.tsx`)
✅ All 5 Bondy scale options rendering
✅ Selection state visualization
✅ Change handler invocation
✅ Disabled state behavior
✅ Color coding for each score level
✅ Accessibility ARIA labels
✅ Keyboard navigation support
✅ Visual ring indicator for selected option
✅ Hover states

### Error Boundary Component (`components/common/ErrorBoundary.tsx`)
✅ Normal children rendering
✅ Error catching from child components
✅ Error message display
✅ Console error logging
✅ "Try Again" button functionality
✅ Page reload on reset
✅ Error state management
✅ getDerivedStateFromError lifecycle
✅ Visual error UI with proper styling
✅ Support message display

## Test Architecture

### Mocking Strategy

1. **Supabase Client**: Mocked in auth tests to avoid real database calls
2. **Crypto API**: Mocked in setup.ts for cross-environment compatibility
3. **window.location.reload**: Mocked in setup.ts for ErrorBoundary tests

### Testing Library Best Practices

1. **Semantic Queries**: Uses `getByRole`, `getByLabelText` for accessibility
2. **User-Centric Testing**: Tests focus on user interactions and visible behavior
3. **Isolated Tests**: Each test is independent with proper cleanup
4. **Clear Test Names**: Descriptive names that explain what is being tested

## Troubleshooting

### Common Issues

**Issue: "Cannot find module" errors**
- Solution: Ensure all dependencies are installed with `npm install`

**Issue: "jsdom not found"**
- Solution: Install jsdom explicitly: `npm install -D jsdom`

**Issue: Tests failing with React errors**
- Solution: Ensure React 19 compatibility with testing-library/react v16+

**Issue: Supabase mock not working**
- Solution: Check that vi.mock() is called before imports in test files

### Debug Mode

To debug tests:

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest

# Or use VS Code debugging
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

## Next Steps

To extend test coverage:

1. **Add tests for stores** (`src/store/`)
   - Test Zustand store actions and state updates

2. **Add tests for remaining components**
   - Participant forms
   - Assessment components
   - Navigation components

3. **Add integration tests**
   - Multi-component workflows
   - Form submission flows

4. **Add E2E tests** (already have Playwright setup)
   - Full user journeys
   - Real database interactions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
