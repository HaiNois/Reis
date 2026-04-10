---
name: check-code-quality
description: Phân tích code để tìm bugs, performance issues, security vulnerabilities, và design problems. Kích hoạt khi user cần: review code, kiểm tra quality, tìm bottleneck, debug, hoặc cần đề xuất cải tiến code. Speedup debugging bằng systematic analysis.
---

# Code Quality Checker Skill

Skill chuyên về **code analysis, review, và debugging** cho Reis project.

## Trigger

User nói một trong các patterns sau:
- "review code", "kiểm tra code"
- "debug", "fix bug", "sửa lỗi"
- "performance", "tối ưu", "bottleneck"
- "security", "vulnerability", "audit"
- "refactor", "cải thiện code"
- "best practice", "convention"
- "type check", "lint", "TS check"
- "memory leak", "render performance"

## Project Context

- Frontend: `d:/Reis/frontend/src/`
- Backend: `d:/Reis/backend/src/`
- Prisma: `d:/Reis/backend/prisma/schema.prisma`
- TypeScript configs: `frontend/tsconfig.json`, `backend/tsconfig.json`
- Docs: `d:/Reis/CLAUDE.md`

## Analysis Scope

### Frontend Analysis
- **React Performance**: Unnecessary re-renders, missing memoization
- **State Management**: Zustand store efficiency, TanStack Query caching
- **Bundle Size**: Large imports, tree-shaking issues
- **Type Safety**: `any` usage, missing types, type assertions
- **Accessibility**: Missing ARIA, keyboard nav issues

### Backend Analysis
- **API Performance**: N+1 queries, missing indexes, slow endpoints
- **Database**: Prisma query efficiency, missing includes
- **Security**: Input validation, SQL injection, XSS
- **Error Handling**: Missing try-catch, unhandled promise rejections
- **Rate Limiting**: Missing endpoints, misconfiguration

### Shared Analysis
- **Code Conventions**: Naming, structure, comments
- **Error Propagation**: Error codes, logging
- **i18n**: Hardcoded strings, missing translations

## Output Format

```
(1) Issues Found (sorted by severity)

## 🔴 Critical
### Issue: [Tên issue]
- Location: [file:line]
- Problem: [Mô tả vấn đề]
- Impact: [Tác động]
- Fix: [Đề xuất fix]

## 🟡 Warning
...

## 🟢 Info
...

(2) Performance Analysis
- [Metric]: [Value] → [Expected]

(3) Recommendations (prioritized)
1. [High] ...
2. [Medium] ...
3. [Low] ...
```

## Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| Critical | 🔴 | Security vulnerability, data loss risk, complete breakage |
| High | 🟠 | Major performance impact, significant bug |
| Medium | 🟡 | Minor bug, convention violation, minor perf issue |
| Low | 🟢 | Style issue, minor improvement suggestion |

## Common Issues & Fixes

### React Performance
```
Issue: Component re-renders on every parent update
Fix: Wrap with React.memo(), use useCallback for handlers

Issue: Large state updates causing jank
Fix: Use Zustand's shallow equality, batch updates

Issue: Missing dependency in useEffect
Fix: Add all deps, use lint rules to catch
```

### Backend Performance
```
Issue: N+1 query in product list
Fix: Add prisma include for variants

Issue: Missing index on slug
Fix: Add @@index([slug]) in Prisma model

Issue: No pagination on large list
Fix: Add .skip() and .take() with limit
```

### TypeScript Issues
```
Issue: Using `any` type
Fix: Define proper interface, use unknown for catch blocks

Issue: Missing return types
Fix: Add explicit return types for functions

Issue: Unused variables
Fix: Remove or prefix with _
```

## Debugging Workflow

1. **Reproduce**: Understand exact steps to trigger issue
2. **Isolate**: Narrow down to specific component/file
3. **Analyze**: Check logs, state, network tab
4. **Fix**: Apply minimal fix
5. **Verify**: Confirm fix works, no regressions

## Quality Standards

### Must Fix (Critical/High)
- Security vulnerabilities
- Memory leaks
- Unhandled errors causing crashes
- Type errors blocking compile

### Should Fix (Medium)
- Performance issues (>100ms on main thread)
- Convention violations
- Missing error handling
- Incomplete i18n

### Nice to Fix (Low)
- Code style improvements
- Minor refactoring for readability
- Comment improvements

## TypeScript Check Commands

```bash
# Frontend
cd d:/Reis/frontend && npx tsc --noEmit

# Backend
cd d:/Reis/backend && npx tsc --noEmit
```

## Prisma Debug

```bash
# Check for N+1
npx prisma studio  # Visual query editor

# Benchmark queries
# Add .explain() before .findMany()
```

## Checklist for Code Review

- [ ] No `any` types
- [ ] All inputs validated
- [ ] Error handling present
- [ ] Logging on errors
- [ ] TypeScript compiles clean
- [ ] i18n strings extracted
- [ ] Accessible markup
- [ ] Performance not degraded
