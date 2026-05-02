---
name: github
version: 1.0.0
description: Comprehensive GitHub workflow and operations skill covering git conventions, GitHub Actions CI/CD, repository management, code review processes, release management, collaboration features, and security best practices.
---

# GitHub — Workflow and Operations

## Overview

This skill covers the full spectrum of GitHub workflows and operations, from local git conventions to remote repository management, CI/CD automation, code review, release management, and security. It ensures that all code produced in this ecosystem follows consistent, professional git and GitHub practices.

## Git Workflow Management

### Branching Strategy

We follow a trunk-based development model with short-lived feature branches:

| Branch Type | Naming Convention | Lifetime | Merge Target |
|---|---|---|---|
| Main | `main` | Permanent | — |
| Development | `develop` | Permanent | — |
| Feature | `feat/<short-description>` | Hours–days | `develop` |
| Bugfix | `fix/<short-description>` | Hours | `develop` |
| Hotfix | `hotfix/<short-description>` | Hours | `main` + `develop` |
| Release | `release/v<semver>` | Days | `main` |
| Chore | `chore/<short-description>` | Hours | `develop` |
| Experiment | `exp/<short-description>` | Variable | May be abandoned |

### Commit Message Convention

All commits MUST follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Commit Message Reference Table:**

| Type | Purpose | Example |
|---|---|---|
| `feat` | New feature | `feat(auth): add OAuth2 login flow` |
| `fix` | Bug fix | `fix(api): resolve null pointer in user endpoint` |
| `docs` | Documentation only | `docs(readme): update installation instructions` |
| `style` | Formatting, no logic change | `style(lint): fix prettier violations` |
| `refactor` | Code restructuring | `refactor(db): extract connection pooling module` |
| `perf` | Performance improvement | `perf(query): add index on user.email column` |
| `test` | Adding/updating tests | `test(auth): add unit tests for JWT validation` |
| `build` | Build system or dependencies | `build(deps): upgrade Next.js to 14.1` |
| `ci` | CI/CD configuration | `ci(actions): add lint step to workflow` |
| `chore` | Maintenance tasks | `chore(repo): update .gitignore rules` |
| `revert` | Revert a previous commit | `revert: revert feat(auth): add OAuth2 login flow` |

**Scope Guidelines:**
- Use a short, lowercase identifier for the affected module
- Common scopes: `auth`, `api`, `ui`, `db`, `deps`, `ci`, `config`, `docs`
- If the change spans multiple scopes, use `*` or omit the scope

### Pull Request Workflow

1. **Create branch** from `develop` with proper naming
2. **Implement changes** with atomic, well-described commits
3. **Push and open PR** using the PR template (see below)
4. **Self-review** using the PR checklist before requesting review
5. **Address feedback** from reviewers promptly
6. **Squash and merge** to keep `develop` history clean
7. **Delete branch** after merge

## GitHub Actions CI/CD

### Workflow Structure

GitHub Actions workflows live in `.github/workflows/` and use YAML configuration.

### Next.js Project — Starter Workflow Template

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ── Job 1: Lint ──────────────────────────────────
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  # ── Job 2: Test ──────────────────────────────────
  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  # ── Job 3: Build ─────────────────────────────────
  build:
    name: Build & Export
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next/

  # ── Job 4: Deploy (main only) ────────────────────
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Common Workflow Patterns

| Workflow | Trigger | Key Steps |
|---|---|---|
| Lint + Format Check | Every push/PR | ESLint, Prettier check, TypeScript |
| Test Suite | Every push/PR | Unit tests, integration tests, coverage |
| Build Verification | Every push/PR | Build, bundle size check |
| Deploy Preview | PR to main | Build + deploy to Vercel preview |
| Deploy Production | Push to main | Build + deploy to Vercel production |
| Dependency Update | Weekly schedule | Dependabot + auto-merge minor updates |
| Release | Version tag push | Build + create GitHub release + deploy |

## GitHub Pages

### Static Site Deployment

For projects using Next.js with static export:

```json
// next.config.js
{
  "output": "export",
  "images": { "unoptimized": true }
}
```

### Custom Domain Configuration

1. Navigate to repo Settings → Pages
2. Under "Custom domain", enter the domain (e.g., `docs.example.com`)
3. Configure DNS: add a `CNAME` record pointing to `<username>.github.io`
4. Enable "Enforce HTTPS" after DNS propagation

## Repository Management

### Issue Templates

Create `.github/ISSUE_TEMPLATE/` with:

- **bug_report.md**: Bug report form with reproduction steps, expected/actual behavior, environment
- **feature_request.md**: Feature request with problem description, proposed solution, alternatives
- **task.md**: General task template with acceptance criteria

### Project Board Setup

Use GitHub Projects (V2) with these default columns:

1. **Backlog** — Unprioritized items
2. **To Do** — Prioritized, ready to pick up
3. **In Progress** — Currently being worked on
4. **In Review** — PR open, awaiting review
5. **Done** — Completed and merged

### Labels Convention

| Label | Color | Purpose |
|---|---|---|
| `bug` | `#d73a4a` | Confirmed bug |
| `feature` | `#a2eeef` | New feature request |
| `enhancement` | `#84b6eb` | Improvement to existing feature |
| `documentation` | `#0075ca` | Docs improvement needed |
| `good first issue` | `#7057ff` | Beginner-friendly task |
| `help wanted` | `#008672` | Community contribution welcome |
| `priority: critical` | `#b60205` | Must fix immediately |
| `priority: high` | `#d93f0b` | Fix within current sprint |
| `priority: medium` | `#fbca04` | Fix within next sprint |
| `priority: low` | `#c5def5` | Backlog / nice to have |
| `wontfix` | `#ffffff` | Declined or deferred |

## Code Review Process

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactor

## Related Issues
Closes #[issue number]

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Accessibility considered
```

### Review Checklist

- **Correctness**: Does the code do what it claims?
- **Testing**: Are there adequate tests for new functionality?
- **Security**: Any potential vulnerabilities (injection, XSS, data leaks)?
- **Performance**: Any obvious performance regressions?
- **Readability**: Is the code clear and well-commented?
- **Consistency**: Does it follow existing patterns in the codebase?
- **Accessibility**: Are ARIA labels, keyboard nav, and screen reader support adequate?

## Release Management

### Semantic Versioning

- **MAJOR** (`X.0.0`): Breaking changes
- **MINOR** (`0.X.0`): New features, backward compatible
- **PATCH** (`0.0.X`): Bug fixes, backward compatible
- **PRE-RELEASE** (`0.0.0-alpha.1`): Pre-release versions

### Changelog Generation

Use conventional commits to auto-generate changelogs. Recommended tool: `standard-version` or `semantic-release`.

```bash
# Manual release
npx standard-version
git push --follow-tags

# Automated release (on main push)
npx semantic-release
```

### GitHub Release Notes Template

```markdown
## v[VERSION] — [DATE]

### Highlights
- [Key feature or improvement]

### Features
- `feat(scope): description` (#PR)

### Bug Fixes
- `fix(scope): description` (#PR)

### Breaking Changes
- [Description and migration guide]

### Contributors
[@username](https://github.com/username)
```

## Security

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Branch Protection Rules

Recommended protection for `main`:

- Require PR reviews (minimum 1 approval)
- Require status checks to pass (CI pipeline)
- Require up-to-date branch before merging
- Require signed commits
- Do not allow force pushes
- Do not allow branch deletion

### Secret Scanning

Enable GitHub secret scanning in repo settings to automatically detect API keys, tokens, and credentials pushed accidentally.

## Collaboration Features

### SSH Key Setup

```bash
ssh-keygen -t ed25519 -C "your@email.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
# Add public key to GitHub Settings → SSH and GPG keys
ssh -T git@github.com
```

### GPG Commit Signing

```bash
gpg --full-generate-key
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
# Add GPG public key to GitHub Settings → SSH and GPG keys
```

### Forking and Contributing

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make changes and commit with conventional messages
5. Push to your fork
6. Open a PR against the upstream repository
