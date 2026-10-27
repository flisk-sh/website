# Contributing to the Flisk CLI Website

Thank you for taking the time to improve the Flisk CLI website! This guide covers everything you need to go from a fresh checkout to an accepted pull request.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation & Local Setup](#2-installation--local-setup)
3. [Validating Your Changes](#3-validating-your-changes)
4. [Branch & Pull Request Workflow](#4-branch--pull-request-workflow)
5. [Commit Message Conventions](#5-commit-message-conventions)
6. [Code Style Notes](#6-code-style-notes)

---

## 1. Prerequisites

| Tool | Required version | How to check |
|------|-----------------|--------------|
| **Git** | Any recent version | `git --version` |
| **Ruby** | 3.3 (matches CI) | `ruby --version` |
| **Bundler** | Comes with Ruby 3.x | `bundle --version` |
| **Node.js** | 22 (matches CI) | `node --version` |

> **Why Ruby 3.3?** The GitHub Actions workflow (`site.yml`) pins `ruby-version: 3.3`. Using the same version locally prevents behaviour differences between your machine and CI.

### Installing Ruby 3.3

The easiest way on macOS or Linux is [rbenv](https://github.com/rbenv/rbenv):

```bash
rbenv install 3.3.8   # or the latest 3.3.x patch
rbenv local 3.3.8
gem install bundler
```

On Ubuntu/Debian you can also use the [official Ruby installer](https://www.ruby-lang.org/en/documentation/installation/).

### Installing Node.js 22

Use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 22
nvm use 22
```

---

## 2. Installation & Local Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/website.git
cd website

# 2. Add the upstream remote so you can pull future changes
git remote add upstream https://github.com/flisk-sh/website.git

# 3. Install Ruby dependencies (reads Gemfile.lock for exact versions)
bundle install

# 4. Start the local Jekyll development server with live-reload
bundle exec jekyll serve --livereload
```

Visit **http://localhost:4000/** to preview the site.  
The server automatically rebuilds whenever you save a file.

---

## 3. Validating Your Changes

The CI pipeline (`.github/workflows/site.yml`) runs **two checks** in order. Run both locally before pushing.

### Step 1 – Public claims check

This script (`scripts/check-claims.mjs`) ensures that any numeric performance claim on the site is backed by a link to the claims registry and that no forbidden wording has crept in.

```bash
node --test scripts/check-claims.test.mjs   # unit tests for the check itself
node scripts/check-claims.mjs               # source pages, includes, layouts, data
```

It scans every page for wording the claims registry forbids (for example "under 5 seconds", or "cold boot" / "from zero" next to the 14-service number; the registry's own "Not a cold boot." is allowed). After `bundle exec jekyll build`, run `node scripts/check-claims.mjs --built` to scan every built page in `_site/` as CI does.

Expected output on success:
```
Public claims checks passed.
```

If the script exits with an error, read the `FAIL:` lines it prints and update the relevant source files before continuing.

### Step 2 – Build the site

```bash
bundle exec jekyll build
```

The built output lands in `_site/`. A clean build (exit code 0, no warnings you introduced) means your change is ready to review.

> **Note:** There is no `package.json` in this repository, so `npm run build` does not apply. The correct build command is `bundle exec jekyll build`.

### Optional – Ruby minitest suite

A small Ruby test suite lives in `test/`. You can run it after the Jekyll build (it reads files from `_site/`):

```bash
bundle exec ruby test/licensing_copy_test.rb
```

---

## 4. Branch & Pull Request Workflow

```
master  ← protected; all merges go through a PR
 └── your-feature-branch  ← one branch per logical change
```

1. **Sync with upstream** before starting work:
   ```bash
   git fetch upstream
   git checkout master
   git merge --ff-only upstream/master
   ```

2. **Create a focused branch** named after what you are changing:
   ```bash
   git checkout -b docs/add-windows-quickstart
   # or
   git checkout -b fix/claims-page-spacing
   ```

3. **Make your changes**, then validate (see §3 above).

4. **Commit** with a conventional commit message (see §5 below).

5. **Push and open a pull request** against `flisk-sh/website`'s `master` branch:
   ```bash
   git push origin docs/add-windows-quickstart
   ```
   Then open a pull request on GitHub. The CI workflow runs automatically on every push to the PR.

6. **Address review feedback** by pushing additional commits to the same branch. Avoid force-pushing to a branch that is already under review unless the reviewer asks you to rebase.

---

## 5. Commit Message Conventions

This repository follows **Conventional Commits** (`type(scope): description`), observed from the existing history:

```
<type>(<scope>): <short imperative description>
```

### Types used in this repo

| Type | When to use |
|------|-------------|
| `docs` | Copy changes, new documentation pages, content edits |
| `fix` | Bug fixes, correcting broken behaviour or incorrect content |
| `feat` | New pages, new components, new site features |
| `chore` | Maintenance tasks (CI tweaks, dependency bumps, file moves) |

### Scopes (optional but encouraged)

Use the area you changed, e.g. `home`, `compare`, `sandbox`, `docs`, `claims`.

### Examples from the repo history

```
docs(home): explain the 80 vs 100 order in the Boot panel
fix(sandbox): tighten header stack - cut 132px of empty space above the hero
feat(docs): animated boot-sequence terminal + auto-generated "on this page" nav
chore: keep installer in root Pages repository
docs: add CONTRIBUTING.md
```

### Rules

- Keep the **subject line under 72 characters**.
- Use the **imperative mood** ("add", "fix", "remove" — not "added" or "fixes").
- Do **not** end the subject line with a period.
- If your PR closes a GitHub issue, add `(#<issue-number>)` at the end of the subject, e.g. `docs: add CONTRIBUTING.md (#51)`.

---

## 6. Code Style Notes

- **Jekyll pages** are HTML with Liquid templating. Keep Liquid tags tidy and avoid breaking the existing front matter structure.
- **CSS** lives in `assets/css/style.css`. The design system is documented in [`DESIGN.md`](DESIGN.md).
- **Public claims** (any number or performance statement visible to users) must be backed by the claims registry at `docs/claims/`. Run `node scripts/check-claims.mjs` to verify.
- **No `package.json`** — do not add npm scripts or a `node_modules/` directory without prior discussion. Node is used only to run `scripts/check-claims.mjs` directly.

---

If you have questions, open a GitHub Discussion or drop a comment on the relevant issue. We are happy to help.
