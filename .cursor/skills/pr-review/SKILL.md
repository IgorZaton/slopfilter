---
name: pr-review
description: >-
  Comprehensive pull request review using specialized review lenses for tests,
  comments, error handling, types, code quality, and simplification. Use when
  reviewing a PR before merge, running pr-review, or when the user asks for
  test coverage, comment accuracy, silent failure, or type design review.
---

# PR Review Toolkit

Comprehensive PR review adapted from [Anthropic's pr-review-toolkit plugin](https://github.com/anthropics/claude-code/tree/main/plugins/pr-review-toolkit).

## Quick start

```text
Review my PR before I merge          → all applicable lenses
/pr-review tests errors              → specific aspects only
/pr-review simplify                  → post-review polish
```

**Aspects:** `comments`, `tests`, `errors`, `types`, `code`, `simplify`, `all` (default)

## Workflow

### 1. Determine scope

```bash
git status
git diff --name-only
git diff main...HEAD    # or base branch
gh pr view              # if PR exists
```

Parse user arguments for requested aspects. Default: all applicable.

### 2. Choose applicable lenses

| Lens | When to run |
|------|-------------|
| **code** | Always — general quality and project rules |
| **tests** | Test files changed or new behavior added |
| **comments** | Comments/docs added or modified |
| **errors** | Error handling, try/catch, logging changed |
| **types** | New or modified types/classes/dataclasses |
| **simplify** | After other lenses pass — clarity polish only |

### 3. Run reviews

**Sequential** (default): one lens at a time, easier to act on.

**Parallel** (if user requests): launch Task subagents simultaneously for speed.

Each lens follows its persona in [agents.md](agents.md). Default scope: recent changes from `git diff`, unless the user specifies files or a PR number.

### 4. Aggregate results

```markdown
# PR Review Summary

## Critical Issues (N)
- [lens]: Description [file:line]

## Important Issues (N)
- [lens]: Description [file:line]

## Suggestions (N)
- [lens]: Suggestion [file:line]

## Strengths
- What is well done

## Recommended Action
1. Fix critical issues
2. Address important issues
3. Consider suggestions
4. Re-run review after fixes
```

### 5. Severity guidance

| Lens | Threshold |
|------|-----------|
| code-reviewer | Report confidence ≥ 80 (91–100 = critical) |
| pr-test-analyzer | Rate gaps 1–10; flag 8–10 as must-add |
| silent-failure-hunter | CRITICAL / HIGH / MEDIUM |
| type-design-analyzer | Rate encapsulation, invariants, usefulness, enforcement 1–10 |
| comment-analyzer | High-confidence inaccuracies and rot |
| code-simplifier | Preserve behavior; improve clarity only |

## Usage examples

**Before commit:**
```text
/pr-review code errors
```

**Before creating PR:**
```text
/pr-review all
```

**After review feedback:**
```text
/pr-review tests    # verify fixes
```

**Parallel:**
```text
/pr-review all parallel
```

## Integration

Recommended order:

1. Write code → **code**
2. Fix issues → **errors** (if error handling touched)
3. Add tests → **tests**
4. Document → **comments**
5. Review passes → **simplify**
6. Create PR (`commit-commands` skill)

## Tips

- Run early — before PR creation, not after
- Focus on changed files, not the whole codebase
- Re-run targeted lenses after fixes
- Be specific: "review test coverage for auth changes" triggers **tests**

## Agent reference

Detailed personas for each lens: [agents.md](agents.md)
