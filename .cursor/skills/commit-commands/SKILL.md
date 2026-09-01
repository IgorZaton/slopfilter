---
name: commit-commands
description: >-
  Git workflow automation for committing, pushing, creating pull requests, and
  cleaning stale branches. Use when the user asks to commit, create a commit,
  commit and push, open a PR, commit-push-pr, or clean gone/stale local branches.
---

# Commit Commands

Git workflow automation adapted from [Anthropic's commit-commands plugin](https://github.com/anthropics/claude-code/tree/main/plugins/commit-commands).

Three workflows: **commit**, **commit-push-pr**, **clean-gone**.

## Shared rules

- Follow [Conventional Commits](https://www.conventionalcommits.org/) — match `.cursor/rules/conventional-commits.mdc`
- **Never** commit secrets (`.env`, credentials, keys)
- **Never** update git config
- **Never** run destructive git commands unless explicitly requested
- **Never** skip hooks (`--no-verify`) unless explicitly requested
- Only commit when the user explicitly asks

---

## `/commit` — Create a git commit

### 1. Gather context (parallel)

```bash
git status
git diff HEAD
git branch --show-current
git log --oneline -10
```

### 2. Draft message

- Analyze staged and unstaged changes
- Match repository commit style from recent log
- Use conventional commit format: `type(scope): imperative description`

### 3. Commit

- Stage relevant files (exclude secrets)
- Commit with HEREDOC message:

```bash
git commit -m "$(cat <<'EOF'
type(scope): short imperative description

Optional body explaining why.
EOF
)"
```

- Run `git status` after to verify success
- If pre-commit hook modifies files, fix and create a **new** commit (do not amend unless amend rules apply)

---

## `/commit-push-pr` — Commit, push, and open PR

### 1. Gather context (parallel)

```bash
git status
git diff HEAD
git branch --show-current
git log --oneline -10
git diff main...HEAD   # or appropriate base branch
```

### 2. Branch

If on `main`/`master`, create a feature branch first:

```bash
git checkout -b feat/descriptive-name
```

### 3. Commit

Same rules as `/commit` above.

### 4. Push

```bash
git push -u origin HEAD
```

Requires `network`/`git_write` permissions as needed.

### 5. Create PR with `gh`

```bash
gh pr create --title "type(scope): short description" --body "$(cat <<'EOF'
## Summary
- Bullet 1
- Bullet 2

## Test plan
- [ ] Step 1
- [ ] Step 2
EOF
)"
```

- Analyze **all commits** on the branch, not just the latest
- Return the PR URL to the user
- Do **not** push unless explicitly requested (this workflow implies push)

---

## `/clean-gone` — Remove stale local branches

Branches deleted on remote but still present locally (`[gone]`).

### 1. List branches

```bash
git branch -v
```

Branches with `+` prefix have worktrees — remove worktrees before deleting.

### 2. List worktrees

```bash
git worktree list
```

### 3. Remove worktrees and delete gone branches

```bash
git branch -v | grep '\[gone\]' | sed 's/^[+* ]//' | awk '{print $1}' | while read branch; do
  echo "Processing branch: $branch"
  worktree=$(git worktree list | grep "\\[$branch\\]" | awk '{print $1}')
  if [ ! -z "$worktree" ] && [ "$worktree" != "$(git rev-parse --show-toplevel)" ]; then
    echo "  Removing worktree: $worktree"
    git worktree remove --force "$worktree"
  fi
  echo "  Deleting branch: $branch"
  git branch -D "$branch"
done
```

If no `[gone]` branches: report no cleanup needed.

**Tip:** Run `git fetch --prune` first if branches aren't marked gone.

---

## Workflow examples

```text
# Quick commit during development
/commit

# Feature ready for review
/commit-push-pr

# After merged PRs
/clean-gone
```
