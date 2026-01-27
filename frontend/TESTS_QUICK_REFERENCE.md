# Unit Tests Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies (see TESTING_SETUP.md for UNC path workarounds)
npm install

# Run all tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm test:ui

# Coverage report
npm test:coverage
```

## 📁 Test Files

### `src/lib/__tests__/auth.test.ts`
```bash
# Run only auth tests
npm test -- auth.test.ts
```

**Coverage:**
- ✅ `hashPin()` - SHA-256 hashing (5 tests)
- ✅ `loginWithPin()` - Authentication (6 tests)
- ✅ `fetchActiveAssessors()` - Assessor list (4 tests)

### `src/components/assessment/__tests__/BondySelector.test.tsx`
```bash
# Run only BondySelector tests
npm test -- BondySelector.test.tsx
```

**Coverage:**
- ✅ Rendering all 5 Bondy options (7 tests)
- ✅ Selection and onChange (4 tests)
- ✅ Disabled state (3 tests)
- ✅ Accessibility (3 tests)
- ✅ Visual feedback (3 tests)
- ✅ Color coding (7 tests)

### `src/components/common/__tests__/ErrorBoundary.test.tsx`
```bash
# Run only ErrorBoundary tests
npm test -- ErrorBoundary.test.tsx
```

**Coverage:**
- ✅ Normal rendering (3 tests)
- ✅ Error catching (4 tests)
- ✅ Error UI (4 tests)
- ✅ Reset functionality (1 test)
- ✅ State management (2 tests)
- ✅ Lifecycle methods (3 tests)
- ✅ Accessibility (2 tests)
- ✅ Visual design (3 tests)

## 📊 Test Statistics

| Metric | Count |
|--------|-------|
| **Total Tests** | 63 |
| **Test Suites** | 3 |
| **Components Tested** | 2 |
| **Modules Tested** | 1 |
| **Test LOC** | ~850 |

## 🔧 Useful Commands

```bash
# Run specific test
npm test -- --grep "hashPin"

# Run in debug mode
node --inspect-brk node_modules/.bin/vitest

# Run with specific reporter
npm test -- --reporter=verbose

# Clear cache and run
npm test -- --clearCache

# Update snapshots (if using)
npm test -- -u
```

## 🎯 What's Tested

### ✅ Authentication (auth.ts)
- PIN hashing consistency
- Login success/failure paths
- Active assessor filtering
- Database error handling

### ✅ Bondy Selector Component
- All score levels render
- Selection state management
- Disabled state behavior
- Color coding accuracy
- ARIA accessibility

### ✅ Error Boundary Component
- Error catching from children
- Error UI display
- Page reload functionality
- State lifecycle management

## 📝 Test Patterns Used

### Mocking
```typescript
vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() }
}))
```

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

render(<Component />)
const button = screen.getByRole('button')
fireEvent.click(button)
expect(mockFn).toHaveBeenCalled()
```

### Assertions
```typescript
expect(element).toBeInTheDocument()
expect(element).toHaveClass('bg-green-500')
expect(mockFn).toHaveBeenCalledWith('value')
expect(result).toBe(expected)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found | Run `npm install` |
| UNC path errors | See TESTING_SETUP.md |
| jsdom not found | `npm install -D jsdom` |
| Tests timeout | Increase timeout with `--testTimeout=10000` |
| Cache issues | Run `npm test -- --clearCache` |

## 📚 Documentation

- **TESTING_SETUP.md** - Installation guide
- **TEST_SUMMARY.md** - Comprehensive overview
- **src/test/README.md** - Test framework docs

## 🎨 Coverage Reports

After running `npm test:coverage`:

1. Open `coverage/index.html` in browser
2. View line-by-line coverage
3. Identify untested code paths

## 🔗 Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)

## ⚡ Pro Tips

1. **Watch mode** is your friend during development
2. **Use `screen.debug()`** to see rendered output
3. **Test user behavior**, not implementation details
4. **Keep tests isolated** - each test should be independent
5. **Use semantic queries** - getByRole, getByLabelText
6. **Mock external dependencies** - APIs, databases, etc.

---

**Total Test Time**: ~200ms (all tests)
**Framework**: Vitest 2.1.8 + Testing Library 16.1.0
