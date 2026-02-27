# Git and Pull Request Guide

This guide provides an introduction to Git workflows for you guys who are new to version control, branching, or pull requests. It covers the fundamental concepts you'll need to work with Git in general, and in this project.

## Table of Contents
- [What is Git?](#what-is-git)
- [Key Concepts](#key-concepts)
- [Creating and Working with Branches](#creating-and-working-with-branches) LINE 80 FOR CREATING YOUR OWN BRANCH AND USING IT
- [Pull Requests](#pull-requests)
- [Common Commands](#common-commands)
- [Workflow Examples](#workflow-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What is Git?

Git is a version control system that tracks changes in your code over time. Think of it as a time machine for your code—you can see what changed, when it changed, and who changed it. It also allows multiple people to work on the same project without stepping on each other's toes.

### Why Use Git?

- **Version History**: See all changes made to your code over time
- **Collaboration**: Multiple people can work on the same project simultaneously
- **Branching**: Work on features without affecting the main codebase
- **Backup**: Your code is stored in a repository (local and remote)
- **Rollback**: Easily revert to previous versions if something breaks

## Key Concepts

### Repository (Repo)

A **repository** is a directory that contains your project files and the entire history of changes. It can be local (on your computer) or remote (on GitHub, GitLab, etc.).

### Commit

A **commit** is a snapshot of your code at a specific point in time. Each commit has a message describing what changed and why.

### Branch

A **branch** is an independent line of development. The main branch (usually called `main` or `master`) contains the production-ready code. You create new branches to work on features or fixes without affecting the main branch.

### Main/Master Branch

The **main branch** (or `master` in older repos) is the primary branch that contains the stable, production-ready code. This is what gets deployed and what users see.

### Pull Request (PR)

A **pull request** (also called a merge request) is a way to propose changes to the main branch from your personal branch. You create a PR when you want to merge your branch's changes back into main. It allows team members to review your code before it gets merged.

### Merge

A **merge** combines changes from one branch into another. When a pull request is approved, it gets merged into the main branch.

## Creating and Working with Branches

### Why Create a Branch?

- Work on new features without breaking the main code
- Experiment safely
- Keep your work organized and separate
- Allow others to review your changes before merging

### Creating a New Branch

**Method 1: Create and switch to a new branch**
```bash
git checkout -b feature/my-new-feature
```

**Method 2: Create branch first, then switch (newer syntax)**
```bash
git branch feature/my-new-feature
git checkout feature/my-new-feature
```

**Method 3: Create and switch in one command (recommended)**
```bash
git switch -c feature/my-new-feature
```

**Method 4: Create branch from github.com/tychart/recipebook**

Go to the front page of the repository on GitHub

<img src="images/front-page-image.jpg" alt="Front Page" />

Locate the dropdown Main button towards the left of the screen

<img src="images/branch-button.jpg" alt="Main Dropdown" />

Once clicked, click 'View all branches' located at the bottom of the dropdown    

<img src="images/click-view-branches.png" alt="View all branches" />

Click on the green 'New Branch' button found at the top right of the screen

<img src="images/new-branch-button.jpg" alt="New Branch" />

Input the name that you want for your branch, then click 'Create new branch' button

Once completed, go to line 123 to switch to your branch in your local environment

### Branch Naming Conventions

Good branch names are descriptive and follow a pattern:
- `feature/add-recipe-search` - New feature
- `fix/login-bug` - Bug fix
- `docs/update-readme` - Documentation update
- `refactor/cleanup-api` - Code refactoring

### Viewing Branches

```bash
# List all local branches
git branch

# List all branches (local and remote)
git branch -a

# Show current branch
git branch --show-current
```

### Switching Between Branches

MAKE SURE YOU HAVE ALREADY CLONED THE REPO VIA THE FOLLOWING COMMAND

```bash
git clone https://github.com/tychart/recipebook.git
```

Once you cd into recipebook run the following command to fetch all branches

```bash
git fetch
```

Next, run the following command to switch to your branch

```bash
# Switch to an existing branch
git checkout YOUR-BRANCH-NAME

# Or using newer syntax
git switch YOUR-BRANCH-NAME
```

If completed successfully, your following terminal (I am using GitBash) should look like this

<img src="images/gitbash-image.jpg" alt="Branch in GitBash" />

### Updating Your Branch with Latest Main

Before starting work or creating a PR, make sure your branch is up to date with main:

```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Switch back to your feature branch
git checkout feature/my-new-feature

# Merge main into your branch
git merge main
```

**Or use rebase (alternative approach):**
```bash
git checkout feature/my-new-feature
git rebase main
```

## Pull Requests

### What is a Pull Request?

A pull request is a request to merge your branch's changes into the main branch. It's like saying "Hey Tyler, I've made these changes. Can you review them and merge them into main?"

### The Pull Request Workflow

1. **Create a branch** and make your changes
2. **Commit your changes** to that branch
3. **Push your branch** to the remote repository (GitHub, GitLab, etc.)
4. **Create a pull request** on the remote platform
5. **Team members review** your code
6. **Address feedback** (make changes if needed)
7. **Pull request gets approved** and merged into main

### Step-by-Step: Creating a Pull Request

#### 1. Make Sure Your Branch is Up to Date

```bash
# Make sure you're on your feature branch
git checkout feature/my-new-feature

# Fetch latest changes from remote
git fetch origin

# Merge main into your branch (or rebase)
git merge origin/main
```

#### 2. Commit Your Changes

```bash
# Stage your changes
git add .

# Or stage specific files
git add path/to/file.js

# Commit with a descriptive message
git commit -m "Add recipe search functionality"
```

**Good commit messages:**
- Clear and descriptive
- Explain what and why, not how
- Examples:
  - ✅ "Fix login bug that prevented users from logging in"
  - ✅ "Add recipe search by ingredient name"
  - ❌ "Fixed stuff"
  - ❌ "Changes"

#### 3. Push Your Branch to Remote

```bash
# Push your branch to remote (first time)
git push -u origin feature/my-new-feature

# Subsequent pushes
git push
```

#### 4. Create Pull Request on GitHub/GitLab

**On GitHub:**
1. Go to your repository on GitHub
2. You'll see a banner saying "feature/my-new-feature had recent pushes"
3. Click "Compare & pull request"
4. Fill out the PR description:
   - What changes were made
   - Why the changes were made
   - Any testing that was done
   - Screenshots if UI changes
5. Request reviewers (optional)
6. Click "Create pull request"

**On GitLab:**
1. Go to your repository
2. Click "Merge requests" → "New merge request"
3. Select your branch and target branch (main)
4. Fill out the description
5. Assign reviewers
6. Click "Create merge request"

### Pull Request Best Practices

**Good PR descriptions include:**
- Summary of changes
- Why the changes were needed
- How to test the changes
- Screenshots (for UI changes)
- Related issues/tickets

**Example PR Description:**
```markdown
## Summary
Adds recipe search functionality to the homepage.

## Changes
- Added search input field to homepage
- Implemented search API endpoint
- Added search results display component

## Testing
- Tested search with various ingredient names
- Verified search works with partial matches
- Tested empty search results handling

## Screenshots
[Add screenshots here if UI changes]

## Related Issues
Closes #123
```

### Reviewing Pull Requests

When someone requests your review:

1. **Read the description** to understand what changed
2. **Look at the "Files changed" tab** to see the code diff
3. **Check for:**
   - Code quality and style
   - Potential bugs
   - Missing tests
   - Documentation updates
4. **Leave comments** on specific lines if needed
5. **Approve** if everything looks good, or **request changes** if issues are found

### Addressing Review Feedback

If reviewers request changes:

1. **Make the requested changes** on your branch
2. **Commit the changes**
   ```bash
   git add .
   git commit -m "Address review feedback: fix typo in search function"
   ```
3. **Push the changes**
   ```bash
   git push
   ```
4. The PR will automatically update with your new commits

### Merging a Pull Request

Once a PR is approved:

**On GitHub:**
1. Click "Merge pull request"
2. Choose merge type:
   - **Create a merge commit**: Preserves all commit history
   - **Squash and merge**: Combines all commits into one
   - **Rebase and merge**: Linear history without merge commits
3. Click "Confirm merge"
4. Delete the branch (optional, but recommended)

**On GitLab:**
1. Click "Merge" button
2. Choose merge strategy
3. Confirm merge

### After Merging

```bash
# Switch back to main
git checkout main

# Pull the latest changes (including your merged PR)
git pull origin main

# Delete your local branch (optional)
git branch -d feature/my-new-feature

# Delete remote branch (if not auto-deleted)
git push origin --delete feature/my-new-feature
```

## Common Commands

### Getting Started

```bash
# Clone a repository
git clone <repository-url>

# Check Git version
git --version

# Configure your name and email (first time setup)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Checking Status

```bash
# See what files have changed
git status

# See detailed changes
git diff

# See changes for specific file
git diff path/to/file.js
```

### Staging and Committing

```bash
# Stage all changes
git add .

# Stage specific file
git add path/to/file.js

# Stage all files in a directory
git add directory/

# Commit with message
git commit -m "Your commit message"

# Stage and commit in one step (only for tracked files)
git commit -am "Your commit message"
```

### Branching

```bash
# Create and switch to new branch
git checkout -b branch-name
# or
git switch -c branch-name

# List branches
git branch

# Switch to branch
git checkout branch-name
# or
git switch branch-name

# Delete branch (must be on different branch)
git branch -d branch-name

# Force delete branch
git branch -D branch-name
```

### Remote Operations

```bash
# View remote repositories
git remote -v

# Fetch latest changes (doesn't merge)
git fetch origin

# Pull latest changes and merge
git pull origin main

# Push branch to remote
git push origin branch-name

# Push and set upstream (first time)
git push -u origin branch-name
```

### Viewing History

```bash
# View commit history
git log

# View compact log
git log --oneline

# View log with graph
git log --oneline --graph --all
```

## Workflow Examples

### Example 1: Adding a New Feature

```bash
# 1. Make sure you're on main and it's up to date
git checkout main
git pull origin main

# 2. Create a new branch for your feature
git checkout -b feature/add-recipe-form

# 3. Make your changes, edit files, etc.
# ... work on your feature ...

# 4. Stage and commit your changes
git add .
git commit -m "Add recipe form with validation"

# 5. Push your branch
git push -u origin feature/add-recipe-form

# 6. Create pull request on GitHub/GitLab
# (Done through web interface)

# 7. After PR is merged, clean up
git checkout main
git pull origin main
git branch -d feature/add-recipe-form
```

### Example 2: Fixing a Bug

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create bug fix branch
git checkout -b fix/login-error

# 3. Fix the bug
# ... make changes ...

# 4. Commit the fix
git add .
git commit -m "Fix login error when username contains special characters"

# 5. Push and create PR
git push -u origin fix/login-error
```

### Example 3: Updating Your Branch with Latest Main

If main has new changes while you're working on your feature:

```bash
# Option 1: Merge main into your branch
git checkout feature/my-feature
git fetch origin
git merge origin/main
git push

# Option 2: Rebase your branch on main (cleaner history)
git checkout feature/my-feature
git fetch origin
git rebase origin/main
git push --force-with-lease
```

## Best Practices

### Branch Management

- ✅ **Do**: Create branches for each feature/fix
- ✅ **Do**: Use descriptive branch names
- ✅ **Do**: Keep branches focused (one feature per branch)
- ✅ **Do**: Delete branches after merging
- ❌ **Don't**: Work directly on main
- ❌ **Don't**: Create branches from other feature branches (unless necessary)

### Commits

- ✅ **Do**: Make small, focused commits
- ✅ **Do**: Write clear commit messages
- ✅ **Do**: Commit often (saves your work)
- ❌ **Don't**: Commit broken code
- ❌ **Don't**: Commit large files or dependencies

### Pull Requests

- ✅ **Do**: Keep PRs small and focused
- ✅ **Do**: Write clear PR descriptions
- ✅ **Do**: Request reviews from teammates
- ✅ **Do**: Respond to review feedback promptly
- ❌ **Don't**: Create PRs with incomplete work
- ❌ **Don't**: Merge your own PRs without review (unless policy allows)

### Communication

- ✅ **Do**: Communicate with your team about what you're working on
- ✅ **Do**: Ask questions if you're unsure
- ✅ **Do**: Help review others' PRs
- ✅ **Do**: Be respectful in code reviews

## Troubleshooting

### I Made Changes on the Wrong Branch

```bash
# Stash your changes (saves them temporarily)
git stash

# Switch to the correct branch
git checkout correct-branch

# Apply your stashed changes
git stash pop
```

### I Want to Undo My Last Commit (But Keep Changes)

```bash
git reset --soft HEAD~1
```

### I Want to Undo My Last Commit (And Discard Changes)

```bash
git reset --hard HEAD~1
```

**Warning**: This permanently deletes your changes. Use with caution!

### I Pushed to the Wrong Branch

```bash
# If you haven't pushed yet, just switch branches and commit there
# If you already pushed, you may need to:
# 1. Create a new branch from your current position
# 2. Reset the wrong branch
# 3. Push your changes to the correct branch
```

### My Branch is Behind Main

```bash
git checkout your-branch
git fetch origin
git merge origin/main
# or
git rebase origin/main
```

### Merge Conflicts

When merging or rebasing, you might encounter conflicts:

1. **Git will mark conflicted files**
2. **Open the files** and look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Changes from main
   >>>>>>> origin/main
   ```
3. **Resolve conflicts** by choosing which code to keep (or combining both)
4. **Remove conflict markers**
5. **Stage the resolved files**
   ```bash
   git add resolved-file.js
   ```
6. **Complete the merge/rebase**
   ```bash
   git commit  # For merge
   # or
   git rebase --continue  # For rebase
   ```

### I Accidentally Deleted a Branch

If you haven't pushed the deletion:
```bash
# Find the commit hash
git reflog

# Recreate the branch from that commit
git checkout -b branch-name <commit-hash>
```

### Can't Push Because Branch is Behind

```bash
# Pull and merge first
git pull origin main

# Or rebase
git pull --rebase origin main

# Then push
git push
```

## Quick Reference

| Task | Command |
|------|---------|
| Create new branch | `git checkout -b branch-name` |
| Switch branch | `git checkout branch-name` |
| View branches | `git branch` |
| Stage changes | `git add .` |
| Commit | `git commit -m "message"` |
| Push branch | `git push -u origin branch-name` |
| Update from main | `git merge origin/main` |
| View status | `git status` |
| View history | `git log --oneline` |
| Delete branch | `git branch -d branch-name` |

## Additional Resources

- [Git Official Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

## If you are looking for more detailed documentation on Git, you can always just use AI or go to the git website.

---

*This guide is designed to get you started with Git and pull requests. For more advanced topics, refer to the official Git documentation or ask your team members for help.*
