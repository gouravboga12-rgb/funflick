# FunFlick — Team Collaboration & Git Synchronization Guide

> **Current Repository Status (Updated Oct 28, 2026):**
> All recent iOS features (Sign in with Apple, iPad layout support, feed and story navigation enhancements, EAS simulator build profiles, and security fixes) have been committed and pushed to `main` on GitHub by **Muzammil-Ahm3d**.
> 
> The repository `https://github.com/gouravboga12-rgb/funflick` is currently clean and 100% up to date.

---

## 🎯 Objective
To work together smoothly on the same project without:
* Overwriting each other's code
* Pushing outdated code over new code
* Encountering painful merge conflicts or broken server deployments

---

## 🛡️ The 3 Golden Rules for Both Developers

1. **NEVER use `git push --force` or `-f`**
   * Normal `git push` protects you: if someone else pushed changes, Git will automatically refuse your push and warn you. A force push bypasses this safety check and can delete work.
2. **PULL BEFORE YOU START WORK**
   * Always run `git pull` before starting a new coding session so you are building on the latest state of the project.
3. **KEEP DOMAINS CLEAN**
   * iOS / Frontend developer works primarily inside `mobile/`.
   * Backend developer works primarily inside `server/`.
   * When each developer stays in their own folder, Git can merge both sets of changes 100% automatically without any conflicts.

---

## 🚀 Step-by-Step Workflow for Backend Developer

### Step 1: Sync Your Local PC with the Latest Code
Before making any changes to the backend, update your local PC with the latest commits pushed by Muzammil:

```bash
# Check if you have any uncommitted local work
git status

# If you have uncommitted changes you want to keep, save them:
git add .
git commit -m "chore: save local work in progress"

# Fetch and pull the latest changes from GitHub:
git pull origin main
```

Now your PC has all the latest iOS changes and backend dependencies.

---

### Step 2: Create a Feature Branch (Recommended Best Practice)
Instead of committing directly to `main`, work inside a dedicated branch:

```bash
git checkout -b feature/backend-updates
```

---

### Step 3: Make Your Backend Changes & Test
Edit files in `server/`, test your endpoints, and ensure the server runs smoothly:

```bash
cd server
npm run dev
```

---

### Step 4: Commit Your Changes
Stage only the files you touched:

```bash
git add server/
git commit -m "feat(backend): describe the changes you made here"
```

---

### Step 5: Push and Open a Pull Request (PR)

Push your branch to GitHub:
```bash
git push -u origin feature/backend-updates
```

Then visit [GitHub Repository](https://github.com/gouravboga12-rgb/funflick) and click **"Compare & pull request"**.
* This allows both team members to review the code.
* GitHub will verify that there are zero conflicts before merging into `main`.

---

## 🔄 Daily Quick Reference

### When You Want to Pull Updates from Your Teammate:
```bash
# 1. Save your local work first
git add .
git commit -m "WIP: save my changes"

# 2. Pull remote changes
git pull origin main
```

### When Git Reports a Merge Conflict:
Don't panic! Git **never deletes your code**. A conflict simply means both developers modified the exact same line of the same file.
1. Open the file marked in red in VS Code.
2. VS Code will highlight:
   * **Current Change** (your local code)
   * **Incoming Change** (your teammate's code)
3. Choose **"Accept Both Changes"** or pick the correct version.
4. Save the file, run `git add <file>`, and run `git commit -m "fix: resolve merge conflict"`.

---

## 🔒 Security & Secrets Checklist
* Never commit `.env` or `server/.env` files (database passwords, Razorpay secrets, JWT keys).
* Never commit signing keys (`*.p8`, `*.p12`, `*.pem`, `*.jks`, `credentials.json`).
* These are already added to `.gitignore` to protect against accidental leaks.

---

**Questions or Sync-up needed?** Coordinate via WhatsApp / Discord before modifying shared files like root `package.json` or database migration scripts.
