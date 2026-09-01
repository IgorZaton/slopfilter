# PR Review Lenses

Specialized review personas. Apply the relevant lens(es) to changed files from `git diff` unless scope is specified.

---

## code-reviewer

**When:** After writing or modifying code; before commit or PR.

**Checks:**
- Project rules (`.cursor/rules/`, `AGENTS.md`)
- Bugs: logic errors, null handling, race conditions, security, performance
- Significant quality issues only

**Confidence 0–100.** Report only ≥ 80. Critical: 90–100.

**Output:** What was reviewed; each issue with confidence, file:line, rule/bug explanation, fix suggestion. Group by Critical vs Important.

---

## pr-test-analyzer

**When:** PR created/updated; before marking ready.

**Checks:**
- Behavioral coverage, not line coverage
- Missing error paths, edge cases, negative tests
- Brittle tests tied to implementation

**Rate gaps 1–10.** Flag 8–10 as must-add.

**Output:** Summary → Critical Gaps → Important Improvements → Test Quality Issues → Positive Observations.

---

## comment-analyzer

**When:** Comments/docs added or modified; before finalizing PR.

**Checks:**
- Comment accuracy vs actual code
- Comment rot and stale documentation
- Missing docs on non-obvious behavior

**Output:** Inaccuracies, stale comments, missing documentation with file:line references.

---

## silent-failure-hunter

**When:** Error handling, try/catch, logging, or fallback logic changed.

**Checks:**
- Empty catch blocks (forbidden)
- Errors swallowed without logging
- Overly broad catch blocks hiding unrelated failures
- Fallbacks masking root cause
- Poor user-facing error messages
- Missing error propagation

**Severity:** CRITICAL / HIGH / MEDIUM

**Output per issue:** Location, severity, description, hidden error types, user impact, recommendation, corrected example.

---

## type-design-analyzer

**When:** New or modified types introduced.

**Analyzes:** Invariants, encapsulation, expression, usefulness, enforcement.

**Rates 1–10:** Encapsulation, Invariant Expression, Invariant Usefulness, Invariant Enforcement.

**Output:**

```markdown
## Type: [Name]
### Invariants Identified
### Ratings (with justification)
### Strengths
### Concerns
### Recommended Improvements
```

Flag: anemic models, exposed mutable internals, doc-only invariants, missing constructor validation.

---

## code-simplifier

**When:** After code works and passes review; user requests clarity polish.

**Rules:**
- **Preserve functionality** — change how, not what
- Follow project standards from `.cursor/rules/`
- Reduce nesting, redundancy, nested ternaries
- Prefer clarity over brevity
- Scope: recently modified code only

**Output:** Simplifications with before/after or specific edit suggestions. Document only significant changes.
