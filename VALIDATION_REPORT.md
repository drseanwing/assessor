# REdI Assessment System - Validation Report

**Generated:** January 27, 2026
**Branch:** `claude/design-validation-ci-tests-nsknQ`

---

## Executive Summary

This report consolidates findings from 12 comprehensive validation tests run against the REdI Assessment System codebase. The system is a React/TypeScript frontend application for clinical education assessment, featuring real-time multi-assessor collaboration.

### Overall Health Score

| Category | Status | Issues |
|----------|--------|--------|
| TypeScript Compilation | PASS | 0 errors |
| ESLint Code Quality | WARNING | 9 issues (1 error, 8 warnings) |
| Production Build | PASS | Successful, 134KB gzipped |
| Security Vulnerabilities | PASS | 0 vulnerabilities in 303 packages |
| React Components | WARNING | 15+ issues identified |
| State Management | WARNING | Critical race condition found |
| Database/Queries | CRITICAL | N+1 patterns, RLS issues |
| Configuration Files | WARNING | Missing CI/CD pipeline |
| Authentication | CRITICAL | PIN bypass vulnerability |
| Dependencies | PASS | All compatible, testing missing |
| Deployment Configs | WARNING | Security headers missing |

### Critical Issues Requiring Immediate Action

1. **PIN Authentication Bypass** - Any 4-digit PIN authenticates any user
2. **Overly Permissive RLS Policies** - All authenticated users can access/modify all data
3. **Race Condition in Auto-Save** - Potential data loss/corruption
4. **Severe N+1 Query Patterns** - 100+ database queries per dashboard load

---

## Table of Contents

1. [TypeScript Type Checking](#1-typescript-type-checking)
2. [ESLint Code Quality](#2-eslint-code-quality)
3. [Build Process Validation](#3-build-process-validation)
4. [Security Vulnerability Scanning](#4-security-vulnerability-scanning)
5. [React Component Analysis](#5-react-component-analysis)
6. [State Management Review](#6-state-management-review)
7. [Database Schema and Queries](#7-database-schema-and-queries)
8. [Configuration Files Review](#8-configuration-files-review)
9. [Authentication and Security](#9-authentication-and-security)
10. [Dependency Health Analysis](#10-dependency-health-analysis)
11. [Deployment Configuration](#11-deployment-configuration)
12. [API and Data Flow](#12-api-and-data-flow)
13. [Recommended CI Pipeline](#13-recommended-ci-pipeline)
14. [Priority Action Items](#14-priority-action-items)

---

## 1. TypeScript Type Checking

**Status:** PASS - No type errors found

### Summary

The TypeScript type checking completed successfully with zero errors across all 30 project files.

### Configuration Analysis

| Setting | Value | Impact |
|---------|-------|--------|
| `target` | ES2022 | Modern JavaScript output |
| `strict` | true | All strict type-checking enabled |
| `noUnusedLocals` | true | Catches unused variables |
| `noUnusedParameters` | true | Catches unused function parameters |
| `noFallthroughCasesInSwitch` | true | Prevents switch case fallthrough bugs |

### Recommendations

```json
// Optional enhancements for tsconfig.app.json
{
  "compilerOptions": {
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 2. ESLint Code Quality

**Status:** WARNING - 9 problems (1 error, 8 warnings)

### Critical Error

| File | Line | Issue |
|------|------|-------|
| `src/pages/LoginPage.tsx` | 24 | Variable `loadAssessors` accessed before declaration |

**Fix Required:**
```typescript
// Move loadAssessors definition BEFORE the useEffect that calls it
const loadAssessors = async () => {
  const data = await fetchActiveAssessors()
  setAssessors(data)
}

useEffect(() => {
  loadAssessors()
}, [])
```

### React Hooks Violations (8 warnings)

| File | Line | Missing Dependency |
|------|------|--------------------|
| `src/hooks/useOfflineSync.ts` | 45 | `updatePendingCount` |
| `src/hooks/useOfflineSync.ts` | 66 | `syncPendingChanges` |
| `src/pages/CourseDashboardPage.tsx` | 72, 75, 90 | `loadAssessmentData` |
| `src/pages/CourseDashboardPage.tsx` | 83 | `loadCourseData` |
| `src/pages/CourseListPage.tsx` | 25 | `loadCourses` |
| `src/pages/ParticipantListPage.tsx` | 23 | `loadCourseData` |

**Recommended Fixes:**

1. Wrap functions with `useCallback` and add to dependencies:
```typescript
const loadAssessmentData = useCallback(async () => {
  // ... implementation
}, [participants, components])

useEffect(() => {
  loadAssessmentData()
}, [loadAssessmentData])
```

2. Or move function definition inside `useEffect` if only used there.

---

## 3. Build Process Validation

**Status:** PASS - Build successful in 3.39 seconds

### Bundle Analysis

| File | Size | Gzipped |
|------|------|---------|
| `index.html` | 0.46 KB | 0.29 KB |
| `index-*.js` | 470.93 KB | 133.87 KB |
| `index-*.css` | 23.73 KB | 4.81 KB |
| **Total** | **494 KB** | **138 KB** |

### Performance Concerns

| Concern | Impact | Recommendation |
|---------|--------|----------------|
| Single JS bundle | All code loads upfront | Implement code splitting with `React.lazy()` |
| Large bundle (134KB gzip) | Slower initial load | Lazy-load heavy dependencies |
| No chunk splitting | No parallel downloads | Configure `manualChunks` in Vite |

### Recommended Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

---

## 4. Security Vulnerability Scanning

**Status:** PASS - No vulnerabilities found

### Scan Results

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| **Total Packages Scanned** | **303** |

### Recommendations

- Run `npm audit` regularly (weekly or before deployments)
- Add `npm audit --audit-level=moderate` to CI pipeline
- Keep `package-lock.json` committed and reviewed

---

## 5. React Component Analysis

**Status:** WARNING - 15+ issues identified

### Large Components (>300 lines)

| File | Lines | Recommendation |
|------|-------|----------------|
| `pages/CourseDashboardPage.tsx` | 530 | Split into custom hooks and sub-components |
| `pages/AssessmentPage.tsx` | 363 | Extract data fetching to custom hook |
| `components/dashboard/DashboardGrid.tsx` | 291 | Near threshold, monitor |
| `stores/assessmentStore.ts` | 568 | Split into multiple stores |

### Missing Key Props

**File:** `components/dashboard/DashboardGrid.tsx` (lines 161-265)
```tsx
// ISSUE: Fragment without key in map
{data.map((item) => (
  <>  {/* Should be <Fragment key={...}> */}
    <tr key={item.participant.participant_id}>...</tr>
    {isExpanded && <tr>...</tr>}  {/* Missing key */}
  </>
))}
```

### Missing useEffect Dependencies

See [ESLint Code Quality](#2-eslint-code-quality) section for complete list.

### Accessibility Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Missing ARIA labels | Icon-only buttons throughout | Add `aria-label` attribute |
| Missing form labels | `ParticipantListPage.tsx:137-149` | Add visible label or `aria-label` |
| Non-keyboard accessible | Clickable table rows, course cards | Add `tabIndex`, `onKeyDown` |
| Non-semantic HTML | Legend in DashboardGrid | Use `<ul>/<li>` instead of `<span>` |

### N+1 Query Patterns

**File:** `pages/CourseDashboardPage.tsx` (lines 157-217)
```typescript
// SEVERE: Triple-nested queries
for (const participant of participants) {
  const { data: assessments } = await supabase...  // Query 1
  const { data: overall } = await supabase...      // Query 2
  for (const component of components) {
    const { data: scores } = await supabase...     // Query 3 * components
  }
}
```

**Impact:** With 20 participants and 5 components = ~120 database queries

**Fix:** Batch all queries with `Promise.all` and filter in memory.

---

## 6. State Management Review

**Status:** WARNING - Critical race condition found

### Critical Issues

#### Race Condition in saveChanges (CRITICAL)

**File:** `stores/assessmentStore.ts` (lines 358-534)

```typescript
saveChanges: (() => {
  let timeoutId = null
  return async () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(async () => {
      // State read AFTER timeout - may have changed
      const { participant, componentAssessments } = get()
      // No mutex - multiple saves can overlap
```

**Fix:**
```typescript
saveChanges: (() => {
  let timeoutId = null
  let isSaving = false
  let pendingSave = false

  return async () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(async () => {
      if (isSaving) {
        pendingSave = true
        return
      }
      isSaving = true
      try {
        // ... save logic
      } finally {
        isSaving = false
        if (pendingSave) {
          pendingSave = false
          get().saveChanges()
        }
      }
    }, 1000)
  }
})()
```

#### Cross-Store Anti-Pattern

**File:** `stores/assessmentStore.ts` (lines 361-373)

```typescript
// BAD: Reads localStorage directly instead of using auth store
const getCurrentAssessorId = () => {
  const stored = localStorage.getItem('redi-auth-storage')
  // ...
}

// FIX: Use the auth store directly
import { useAuthStore } from './authStore'
const assessorId = useAuthStore.getState().assessor?.assessor_id
```

#### Missing Selector Optimization

**All store usage** destructures entire state, causing unnecessary re-renders:

```typescript
// BAD: Re-renders on ANY state change
const { participant, components, outcomes, ... } = useAssessmentStore()

// GOOD: Only re-renders when specific state changes
const participant = useAssessmentStore(state => state.participant)
const saveStatus = useAssessmentStore(
  state => ({ saveStatus: state.saveStatus, lastSaved: state.lastSaved }),
  shallow
)
```

---

## 7. Database Schema and Queries

**Status:** CRITICAL - Multiple severe issues

### Critical Issues

#### PIN Authentication Bypass (CRITICAL)

**File:** `lib/auth.ts` (lines 47-56)

```typescript
// SECURITY ISSUE: PIN validation is bypassed
// Any 4-digit PIN authenticates any assessor!
if (credentials.pin.length !== 4 || !/^\d{4}$/.test(credentials.pin)) {
  return { success: false, error: 'Invalid PIN format' }
}
// Hash comparison is COMMENTED OUT
```

#### Overly Permissive RLS Policies (CRITICAL)

**File:** `supabase/migrations/20260125_initial_schema.sql` (lines 228-253)

```sql
-- ALL tables have this overly permissive policy:
CREATE POLICY "Allow all for authenticated users" ON assessors
  FOR ALL USING (auth.role() = 'authenticated');
```

**Risks:**
- Any authenticated user can read ALL assessors including `pin_hash`
- Any user can modify ANY participant's assessments
- No course-based access restrictions

#### N+1 Query Pattern (HIGH)

| Location | Impact |
|----------|--------|
| `stores/assessmentStore.ts:129-150` | O(n) queries for n components |
| `pages/CourseDashboardPage.tsx:157-217` | O(n*m) queries for n participants, m components |
| `pages/CourseListPage.tsx:44-57` | O(n) queries for n courses |

**Fix for CourseDashboardPage:**
```typescript
// Batch all queries
const [assessmentsResult, overallResult, scoresResult] = await Promise.all([
  supabase.from('component_assessments').select('*').in('participant_id', participantIds),
  supabase.from('overall_assessments').select('*').in('participant_id', participantIds),
  supabase.from('outcome_scores').select('*').in('assessment_id', assessmentIds)
])
// Then organize in memory
```

### Missing Indexes

```sql
-- Add these indexes for common queries
CREATE INDEX idx_outcome_scores_assessment ON outcome_scores(assessment_id, outcome_id);
CREATE INDEX idx_participants_name ON participants(candidate_name);
CREATE INDEX idx_course_templates_name ON course_templates(template_name);
```

### Sensitive Data Exposure

**File:** `lib/auth.ts` (lines 73-77)

```typescript
// ISSUE: Exposes pin_hash to client
const { data } = await supabase.from('assessors').select('*')

// FIX: Select only needed fields
const { data } = await supabase
  .from('assessors')
  .select('assessor_id, name, email, is_active')
```

---

## 8. Configuration Files Review

**Status:** WARNING - Missing CI/CD infrastructure

### Missing Critical Files

| File | Priority | Purpose |
|------|----------|---------|
| `.github/workflows/ci.yml` | HIGH | CI/CD pipeline |
| `vitest.config.ts` | HIGH | Test configuration |
| `frontend/.prettierrc` | MEDIUM | Code formatting |
| `frontend/.lintstagedrc` | MEDIUM | Pre-commit linting |
| `.nvmrc` | MEDIUM | Node version pinning |
| `.dockerignore` | MEDIUM | Docker build optimization |
| `.editorconfig` | LOW | Cross-editor consistency |

### package.json Improvements

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc -b --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Vite Configuration Improvements

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

---

## 9. Authentication and Security

**Status:** CRITICAL - Multiple severe vulnerabilities

### Critical Vulnerabilities

| Issue | Severity | Location |
|-------|----------|----------|
| PIN authentication bypass | CRITICAL | `lib/auth.ts:47-56` |
| Client-side only authentication | HIGH | `lib/auth.ts`, `stores/authStore.ts` |
| No RLS enforcement | HIGH | Using anon key without Supabase Auth |
| Insecure session storage | HIGH | localStorage without encryption |
| Session expiry client-side only | MEDIUM | Can be modified by attacker |
| No rate limiting | MEDIUM | Brute force possible |
| No logout invalidation | MEDIUM | Sessions can be replayed |

### Immediate Fixes Required

1. **Implement proper PIN verification on backend:**
```typescript
// Backend API endpoint (not client-side!)
export async function verifyPin(assessorId: string, pin: string): Promise<boolean> {
  const { data: assessor } = await supabaseAdmin
    .from('assessors')
    .select('pin_hash')
    .eq('assessor_id', assessorId)
    .single()

  return bcrypt.compare(pin, assessor.pin_hash)
}
```

2. **Use Supabase Auth or implement JWT tokens**
3. **Add rate limiting (5 attempts per minute)**
4. **Implement account lockout after consecutive failures**

### Positive Findings

- No XSS via `dangerouslySetInnerHTML`
- PIN input properly masked
- HTTPS enforced by Supabase
- Autocomplete disabled on PIN field

---

## 10. Dependency Health Analysis

**Status:** PASS - All dependencies compatible

### Outdated Packages

| Package | Current | Latest | Update Type |
|---------|---------|--------|-------------|
| `@supabase/supabase-js` | 2.91.1 | 2.93.1 | Patch |
| `react` | 19.2.3 | 19.2.4 | Patch |
| `react-dom` | 19.2.3 | 19.2.4 | Patch |
| `tailwindcss` | 3.4.19 | 4.1.18 | **Major** |

### Missing Required Packages

```bash
# Testing (HIGH PRIORITY)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/coverage-v8

# Code quality
npm install -D prettier eslint-config-prettier

# Security
npm install -D eslint-plugin-security
```

### Safe Updates

```bash
npm update @supabase/supabase-js react react-dom typescript-eslint
```

---

## 11. Deployment Configuration

**Status:** WARNING - Security headers missing

### Dockerfile Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| Running as root | HIGH | Add non-root user |
| No HEALTHCHECK | MEDIUM | Add Docker HEALTHCHECK |
| Missing .dockerignore | MEDIUM | Create file |
| Unpinned base images | LOW | Use specific versions |

### Recommended Dockerfile

```dockerfile
FROM node:20.11-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:1.25-alpine

# Non-root user
RUN addgroup -g 101 -S nginx || true \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx || true

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Security Headers

```nginx
# Add to nginx.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Vercel Security Headers

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; ..." }
      ]
    }
  ],
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

---

## 12. API and Data Flow

**Status:** WARNING - Multiple patterns need improvement

### Issues Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Sequential fetches (not parallel) | HIGH | `assessmentStore.ts:129-151` |
| No timeout handling | HIGH | All Supabase calls |
| Optimistic updates without rollback | MEDIUM | `assessmentStore.ts:184-253` |
| Limited retry logic (no exponential backoff) | MEDIUM | `useOfflineSync.ts` |
| Missing loading states | MEDIUM | `assessmentStore.loadAssessments` |
| No cache invalidation | MEDIUM | `lib/db.ts` IndexedDB |
| Incomplete reconnection strategy | MEDIUM | `useRealtime.ts` |
| No conflict resolution | MEDIUM | Real-time sync |

### Recommended Patterns

**Parallel Fetching:**
```typescript
const [assessments, overall, scores] = await Promise.all([
  supabase.from('component_assessments').select('*'),
  supabase.from('overall_assessments').select('*'),
  supabase.from('outcome_scores').select('*')
])
```

**Exponential Backoff:**
```typescript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
}
```

**Optimistic Update with Rollback:**
```typescript
setBondyScore: (componentId, outcomeId, score) => {
  const previousState = get().componentAssessments[componentId]

  set(state => ({ /* optimistic update */ }))

  get().saveChanges().catch(() => {
    // Rollback on failure
    set(state => ({
      componentAssessments: {
        ...state.componentAssessments,
        [componentId]: previousState
      }
    }))
  })
}
```

---

## 13. Recommended CI Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Security audit
        run: npm audit --audit-level=moderate

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  # Uncomment when tests are added
  # test:
  #   name: Tests
  #   runs-on: ubuntu-latest
  #   steps:
  #     - run: npm run test:coverage

  docker:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: redi-assessment:${{ github.sha }}
          build-args: |
            VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

---

## 14. Priority Action Items

### CRITICAL (Fix Before Production)

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 1 | PIN authentication bypass | `lib/auth.ts` | 47-56 |
| 2 | Overly permissive RLS policies | `migrations/*.sql` | 228-253 |
| 3 | Race condition in auto-save | `stores/assessmentStore.ts` | 358-534 |
| 4 | N+1 query patterns (120+ queries) | `pages/CourseDashboardPage.tsx` | 157-217 |

### HIGH (Fix Soon)

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 5 | Client-side only authentication | `lib/auth.ts`, `stores/authStore.ts` | - |
| 6 | Sensitive data (pin_hash) exposed | `lib/auth.ts` | 73-77 |
| 7 | Missing CI/CD pipeline | `.github/workflows/` | - |
| 8 | Variable accessed before declaration | `pages/LoginPage.tsx` | 24 |
| 9 | Missing Content-Security-Policy | `nginx.conf` | - |
| 10 | Cross-store localStorage anti-pattern | `stores/assessmentStore.ts` | 361-373 |

### MEDIUM (Address in Next Sprint)

| # | Issue | File |
|---|-------|------|
| 11 | Add testing framework (Vitest) | `package.json` |
| 12 | Fix 8 useEffect dependency warnings | Multiple pages |
| 13 | Add keyboard accessibility | `DashboardGrid.tsx`, `CourseListPage.tsx` |
| 14 | Implement selector optimization | All store usages |
| 15 | Add Docker HEALTHCHECK and non-root user | `Dockerfile` |
| 16 | Implement code splitting | `vite.config.ts` |
| 17 | Add rate limiting | `nginx.conf` or backend |
| 18 | Implement cache invalidation | `lib/db.ts` |

### LOW (Nice to Have)

| # | Issue | File |
|---|-------|------|
| 19 | Add Prettier configuration | `.prettierrc` |
| 20 | Add pre-commit hooks (Husky) | `package.json` |
| 21 | Add path aliases (@/) | `tsconfig.json`, `vite.config.ts` |
| 22 | Update index.html metadata | `index.html` |
| 23 | Add .dockerignore | Root directory |
| 24 | Pin base image versions | `Dockerfile` |

---

## Appendix: Files to Create

### 1. `.github/workflows/ci.yml`
See [Recommended CI Pipeline](#13-recommended-ci-pipeline)

### 2. `.dockerignore`
```
node_modules
frontend/node_modules
dist
frontend/dist
.git
*.md
.env*
**/*.test.*
Dockerfile*
.github
```

### 3. `frontend/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 4. `frontend/src/test/setup.ts`
```typescript
import '@testing-library/jest-dom'
```

### 5. `frontend/.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 6. `.nvmrc`
```
20
```

---

*Report generated by automated validation suite*
