# Unit Tests

This directory contains the unit test configuration and setup for the REdI Assessment frontend.

## Test Framework

- **Vitest**: Fast unit test framework with native ES modules support
- **@testing-library/react**: React component testing utilities
- **jsdom**: DOM implementation for Node.js

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## Test Structure

Tests are located next to the files they test in `__tests__` directories:

```
src/
├── lib/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.test.ts
├── components/
│   ├── assessment/
│   │   ├── BondySelector.tsx
│   │   └── __tests__/
│   │       └── BondySelector.test.tsx
│   └── common/
│       ├── ErrorBoundary.tsx
│       └── __tests__/
│           └── ErrorBoundary.test.tsx
```

## Test Coverage

Current test coverage includes:

### `lib/auth.ts`
- ✅ PIN hashing with SHA-256
- ✅ Login validation with valid/invalid credentials
- ✅ Active assessor filtering
- ✅ Error handling

### `components/assessment/BondySelector.tsx`
- ✅ Rendering all 5 Bondy scale options
- ✅ Selection behavior and state management
- ✅ Disabled state handling
- ✅ Color coding for different scores
- ✅ Accessibility features (ARIA labels, keyboard support)

### `components/common/ErrorBoundary.tsx`
- ✅ Error catching from child components
- ✅ Error UI rendering
- ✅ Reset functionality (page reload)
- ✅ Error state management
- ✅ Accessibility and visual design

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  describe('rendering', () => {
    it('should render correctly', () => {
      render(<MyComponent />)
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('should handle clicks', () => {
      const onClick = vi.fn()
      render(<MyComponent onClick={onClick} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalled()
    })
  })
})
```

### Best Practices

1. **Use descriptive test names**: Tests should read like documentation
2. **Test behavior, not implementation**: Focus on what users see and do
3. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
4. **Mock external dependencies**: Mock Supabase, APIs, etc.
5. **Clean up after tests**: Use `afterEach(cleanup)` in setup.ts

## Configuration

- **vitest.config.ts**: Main Vitest configuration
- **src/test/setup.ts**: Test environment setup and global mocks

## Debugging Tests

```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --grep "hashPin"

# Run tests in debug mode
npm test -- --inspect-brk
```

## Coverage Reports

After running `npm test:coverage`, coverage reports are generated in:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/coverage-final.json` - JSON report
- Console output with text report
