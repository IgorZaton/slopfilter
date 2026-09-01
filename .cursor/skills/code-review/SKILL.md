---
name: code-review
description: >-
  Automated pull request code review using parallel specialized reviewers with
  high-signal filtering. Use when reviewing PRs, running /code-review, posting
  PR review comments, or when the user asks for automated code review on a
  GitHub pull request.
---

# Code Review

Automated PR review adapted from [Anthropic's code-review plugin](https://github.com/anthropics/claude-code/tree/main/plugins/code-review). Uses multiple independent reviewers and validation to surface only high-confidence issues.

## Prerequisites

- Git repository with GitHub remote
- `gh` CLI installed and authenticated
- Project guidelines in `.cursor/rules/` (and `AGENTS.md` if present)

## Quick start

```text
Review PR #123
Review this PR and post comments: --comment
```

Default: output findings to the terminal. With `--comment`: post summary or inline comments on the PR.

## Workflow

Create a todo list, then follow these steps.

### 1. Skip check

Stop if any are true:

- PR is closed or draft
- Change is trivial/automated and obviously correct
- You already posted a review comment on this PR (`gh pr view <PR> --comments`)

Still review AI-generated PRs.

### 2. Gather project guidelines

List paths (not contents) for relevant guideline files:

- Root `AGENTS.md` if it exists
- `.cursor/rules/*.mdc` applicable to changed files
- Any nested rules in directories containing modified files

### 3. Summarize the PR

Use `gh pr view`, `gh pr diff`, and the PR title/description to summarize intent and scope.

### 4. Parallel review (4 reviewers)

Launch 4 Task subagents in parallel. Each returns issues with description and reason (e.g. "project rule violation", "bug").

| Reviewer | Focus |
|----------|-------|
| **1 & 2** | Project guideline compliance (`.cursor/rules/`, `AGENTS.md`). Only apply rules scoped to the file or its parent directories. |
| **3** | Obvious bugs in the diff only — no extra context reads. Significant bugs only. |
| **4** | Security, incorrect logic, and other problems in changed code only. |

**Only flag HIGH SIGNAL issues:**

- Code that will fail to compile/parse (syntax, types, missing imports)
- Code that will definitely produce wrong results regardless of inputs
- Clear, unambiguous project rule violations (quote the exact rule)

**Do NOT flag:**

- Style or quality nits
- Issues depending on unknown runtime state
- Pre-existing issues outside the diff
- Things linters will catch
- General quality concerns unless required by project rules
- Rules explicitly silenced in code (e.g. lint ignore)

Pass PR title and description to every reviewer for context.

### 5. Validate findings

For each issue from reviewers 3 and 4, launch parallel validation subagents. Confirm the issue is real with high confidence before keeping it.

### 6. Filter and output

Drop unvalidated issues. Output to terminal:

- If issues found: list each with brief description, file, and line range
- If none: `No issues found. Checked for bugs and project guideline compliance.`

If `--comment` was **not** requested, stop here.

### 7. Post PR comments (only with `--comment`)

- **No issues:** post summary via `gh pr comment`
- **Issues found:** post one inline comment per unique issue via `gh` (or available GitHub integration). Include:
  - Brief issue description
  - Link to code: `https://github.com/owner/repo/blob/<full-sha>/path/file.ext#Lstart-Lend`
  - Committable suggestion only for small, self-contained fixes (≤5 lines). Never suggest a partial fix that still needs follow-up.

**One comment per unique issue. No duplicates.**

## Output format (terminal)

```markdown
## Code review

Found N issues:

1. [Description] ([reason])

   path/to/file.py:L10-L15

2. ...
```

## False positive filter

Never flag: pre-existing issues, correct-looking "bugs", pedantic nits, linter-catchable items, general quality unless in project rules, silenced rule violations.

## Tips

- Write specific project rules → better reviews
- Trust validated high-signal filtering
- Run on non-trivial PRs before merge
- Use `--comment` only when the user wants GitHub feedback posted
