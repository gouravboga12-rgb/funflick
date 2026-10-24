# FunFlick — Security Audit & Codebase Issues Report

**Generated:** October 24, 2026  
**Audited by:** Antigravity AI Code Audit  
**Scope:** Full codebase — `mobile/`, `server/`, `src/` (web), infra configs  
**Current App Version:** `1.0.17` (versionCode `18`)  
**Active Branch:** `main`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Security Issues](#2-critical-security-issues--must-fix-before-app-store)
3. [High Severity Issues](#3-high-severity-issues)
4. [Medium Severity Issues](#4-medium-severity-issues)
5. [Code Quality & Repository Issues](#5-code-quality--repository-issues)
6. [Pending Git Changes Analysis](#6-pending-git-changes-analysis)
7. [Infrastructure & Deployment Notes](#7-infrastructure--deployment-notes)
8. [What Is Done Well](#8-what-is-done-well)
9. [iOS Build Readiness Assessment](#9-ios-build-readiness-assessment)
10. [Fix Priority Matrix](#10-fix-priority-matrix)

---

## 1. Executive Summary

FunFlick is a full-stack Indian short-video and creator monetization platform.

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native 0.86 + Expo SDK 57 + expo-video + EAS Build |
| Web Frontend | React 19 + Vite 8 + Tailwind CSS 4 + React Router 7 |
| Backend API | Express 4 + MySQL 8 + AWS S3 + Razorpay + Nodemailer |
| Infrastructure | AWS EC2 + NGINX + Let's Encrypt SSL + AWS S3 (ap-south-2) |

**Total Critical Issues Found:** 2  
**Total High Issues Found:** 3  
**Total Medium Issues Found:** 3  
**Total Code/Repo Issues Found:** 4

> **CAUTION:** Issue CRITICAL-001 (SSRF) and HIGH-002 (Sensitive Files) must be resolved before any iOS App Store submission. A live SSRF vulnerability on AWS EC2 can expose IAM credentials and lead to full cloud account compromise.

---

## 2. Critical Security Issues — Must Fix Before App Store

---

### CRITICAL-001 — Server-Side Request Forgery (SSRF) in Media Download Proxy

| Attribute | Detail |
|-----------|--------|
| **File** | `server/src/controllers/mediaController.js` Lines 30-61 |
| **Endpoint** | `GET /api/media/download?url=<any_url>` |
| **Auth Required** | None — Completely public endpoint |
| **CVSS Estimate** | 9.1 (Critical) |

**Root Cause:**

```javascript
// VULNERABLE CODE
const isAllowed = url.includes(bucket) || url.startsWith('http');
//                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                 This passes for EVERY http:// or https:// URL in the world
const response = await fetch(url);  // Fetches ANY URL the attacker provides
```

**Attack Example:**

```
GET /api/media/download?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Since FunFlick runs on AWS EC2 with an attached IAM Role, this returns your temporary AWS access key, secret key, and session token — full AWS account compromise.

**Fixed Code:**

```javascript
export async function downloadMedia(req, res) {
  try {
    const { url, filename } = req.query;
    if (!url) return res.status(400).json({ error: 'url parameter is required' });

    // SECURE: Only allow our exact S3 bucket domain
    const bucket = process.env.S3_MEDIA_BUCKET || 'funflick-media-storage-live';
    const region = process.env.AWS_REGION || 'ap-south-2';
    const allowedOrigin = `https://${bucket}.s3.${region}.amazonaws.com/`;

    if (!url.startsWith(allowedOrigin)) {
      return res.status(403).json({ error: 'Unauthorized media source' });
    }

    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch media' });

    const cleanFilename = (filename || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

    // SECURE: Stream — never loads file into RAM
    const { Readable } = await import('stream');
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error('Download media proxy error:', err);
    return res.status(500).json({ error: 'Download failed' });
  }
}
```

---

### CRITICAL-002 — DoS via Memory Exhaustion in Download Proxy

| Attribute | Detail |
|-----------|--------|
| **File** | `server/src/controllers/mediaController.js` Lines 55-56 |
| **Auth Required** | None |
| **Impact** | Node.js OOM crash, full API downtime |

**Root Cause:**

```javascript
// VULNERABLE CODE
const arrayBuffer = await response.arrayBuffer(); // Entire video loaded into RAM
return res.send(Buffer.from(arrayBuffer));         // Duplicated into a Buffer
```

5 concurrent 200MB video downloads = ~2GB heap usage -> OOM kill -> server crash.

**Fix:** Use the streaming approach in CRITICAL-001 fix above (`Readable.fromWeb().pipe(res)`).

---

## 3. High Severity Issues

---

### HIGH-001 — View Count Inflation: Creator Payout Exploitation

| Attribute | Detail |
|-----------|--------|
| **File** | `server/src/controllers/videoController.js` Lines 492-501 |
| **Endpoint** | `POST /api/videos/:id/view` |
| **Auth Required** | None — Completely open |
| **Business Impact** | Cash payouts can be fraudulently inflated |

**Root Cause:**

```javascript
export async function recordView(req, res) {
  const { id } = req.params;
  // No rate limiting. No IP deduplication. No auth. No bot detection.
  await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [id]);
  return res.json({ success: true });
}
```

The payout system compares `video.views_count` against `previousSettled` to calculate milestone rewards. A script looping this endpoint inflates views and triggers unearned cash payouts.

**Fix:**

```javascript
import rateLimit from 'express-rate-limit';

const viewRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  max: 1,                           // 1 view per IP per video per day
  keyGenerator: (req) => `${req.ip}:${req.params.id}`,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/:id/view', optionalAuth, viewRateLimit, recordView);
```

---

### HIGH-002 — Sensitive Credentials & Legal Documents in Project Workspace

| Attribute | Detail |
|-----------|--------|
| **Location** | Root directory of FunFlick workspace |
| **Impact** | Screenshare leaks, git push accidents, backup exposure |

**Dangerous files found in project root:**

| File | Risk |
|------|------|
| `funflick-key.pem` | Live EC2 SSH private key — full server access |
| `rzp-key (32).csv` | Razorpay API key export — financial system access |
| `mobile/@funflick__funflick.jks` | Production Android keystore |
| `clean_signature.png` | Founder/director digital signature |
| `company_seal.png` | Official company seal |
| `Declaration_On_Letter_Head.pdf` | Legal declaration document |
| `FUNFLICK ACK Print_Udyam Registration Certificate.pdf` | MSME certificate |
| `Razorpay_Undertaking_Letter_FUNFLICK.*` | KYC undertaking letter |

**Actions Required:**
1. Move `funflick-key.pem` and `rzp-key*.csv` to a password manager (Bitwarden/1Password) immediately
2. Move Android `.jks` to an encrypted folder outside the project directory
3. Move all KYC/legal documents to a secured Google Drive or encrypted folder
4. Verify nothing was ever committed: `git log --all --name-only | grep -E '\.pem|\.csv|\.jks'`

---

### HIGH-003 — Default Credentials with Known Fallback Values in Source Code

**Files affected:**

```javascript
// server/src/config/db.js — Line 9
password: process.env.DB_PASSWORD || 'FunFlick2026!SecurePass',

// server/src/middlewares/authMiddleware.js — Line 11
jwt.verify(token, process.env.JWT_SECRET || 'funflick_secret', ...)

// server/src/config/db.js — Lines 259
const hash = await bcrypt.hash('FunFlicks@12', 10);
// Seeds admin: funflick0308@gmail.com / FunFlicks@12
```

If the production `.env` is absent or missing a key, the server silently uses these publicly-visible defaults.

**Fix:**

```javascript
// Replace fallback defaults with hard failures:
password: process.env.DB_PASSWORD ?? (() => {
  throw new Error('DB_PASSWORD environment variable is required');
})(),
```

Also change the seeded admin password immediately in production:
```sql
UPDATE users SET password_hash = '<new_bcrypt_hash>' WHERE email = 'funflick0308@gmail.com';
```

---

## 4. Medium Severity Issues

---

### MEDIUM-001 — CORS Wildcard in Production API

**File:** `server/src/app.js` Line 24

```javascript
app.use(cors({ origin: '*' }));  // Any website can call the API
```

**Fix:**

```javascript
app.use(cors({
  origin: [
    'https://funflick.in',
    'https://www.funflick.in',
    'https://funflick-theta.vercel.app',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : [])
  ],
  credentials: true
}));
```

---

### MEDIUM-002 — `usesCleartextTraffic: true` Enabled for Android

**File:** `mobile/app.json` Lines 117-123

```json
["expo-build-properties", {
  "android": { "usesCleartextTraffic": true }
}]
```

Since the production API uses HTTPS exclusively, set this to `false`. Google Play security review may flag this flag as a finding.

---

### MEDIUM-003 — Admin Route `GET /api/admin/ads` Has No Authentication

**File:** `server/src/routes/adminRoutes.js` Line 99

```javascript
router.get('/ads', getAdminAds);  // No authenticateToken, no requireSuperAdmin
```

All other admin routes require authentication. While intentionally public (mobile ad fetch), the placement in admin routes is misleading. Move to `adRoutes.js` or add a clear comment.

---

## 5. Code Quality & Repository Issues

---

### REPO-001 — CRLF vs LF Line Ending Mismatch (Phantom Git Diffs)

`git status` shows 5 modified files. Verified with `git diff --ignore-cr-at-eol` = **zero actual code differences**. All changes are phantom — caused solely by Windows `\r\n` vs Unix `\n` line endings.

**Affected files:**
- `mobile/src/context/AppContext.js`
- `mobile/src/screens/feed/HomeScreen.js`
- `mobile/src/screens/feed/ReelsScreen.js`
- `mobile/src/screens/feed/StoryViewerScreen.js`
- `server/src/controllers/payoutController.js` ← Also has REAL new code (see Section 6)

**Fix — Create `.gitattributes`:**

```gitattributes
* text=auto eol=lf
*.js   text eol=lf
*.jsx  text eol=lf
*.json text eol=lf
*.md   text eol=lf
*.ts   text eol=lf
*.tsx  text eol=lf

# Binary — never convert
*.png binary
*.jpg binary
*.jks binary
*.pem binary
*.mp4 binary
```

```bash
git add --renormalize .
git commit -m "chore: normalize line endings to LF via .gitattributes"
```

---

### REPO-002 — Broken `node_modules` (Cross-OS Install)

`npm run lint` fails with: `Permission denied` + `Cannot find @oxlint/binding-darwin-arm64`

The `node_modules` folder was copied from a Windows/Linux machine. Platform-native binaries for macOS (Apple Silicon) are missing.

**Fix:**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### REPO-003 — iOS `buildNumber` Not Set in `app.json`

Android has `versionCode: 18`. iOS section has **no `buildNumber`**. EAS will default to `"1"` which conflicts on App Store Connect resubmission.

**Fix — add to `mobile/app.json`:**

```json
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "com.funflick.app",
  "buildNumber": "18",
  "associatedDomains": [
    "applinks:funflick.in",
    "applinks:www.funflick.in"
  ]
}
```

---

### REPO-004 — iOS Profile Missing in `eas.json`

Current production profile:

```json
"production": {
  "credentialsSource": "local",
  "android": { "buildType": "app-bundle" }
  // No iOS config
}
```

EAS needs explicit iOS configuration for App Store distribution. See iOS Build Plan document for the complete fix.

---

## 6. Pending Git Changes Analysis

| File | Status |
|------|--------|
| `mobile/src/context/AppContext.js` | CRLF phantom only — no real changes |
| `mobile/src/screens/feed/HomeScreen.js` | CRLF phantom only — no real changes |
| `mobile/src/screens/feed/ReelsScreen.js` | CRLF phantom only — no real changes |
| `mobile/src/screens/feed/StoryViewerScreen.js` | CRLF phantom only — no real changes |
| `server/src/controllers/payoutController.js` | **REAL new code** — markAsPaid + remindCreatorPayoutDetails — **MUST COMMIT** |

> **IMPORTANT:** `payoutController.js` contains genuinely new milestone payout functions not yet committed to git. These must be committed and deployed to EC2 to take effect.

```bash
# Step 1: Commit the real change
git add server/src/controllers/payoutController.js
git commit -m "feat(server): add payout milestone validation and creator reminder endpoint"
git push origin main

# Step 2: Deploy to EC2
ssh -i funflick-key.pem ubuntu@98.130.142.69
cd /var/www/funflick-api
git pull origin main
pm2 restart all  # or: killall node && node src/server.js &
```

---

## 7. Infrastructure & Deployment Notes

### NGINX — `nginx-funflick.conf`
| Check | Status |
|-------|--------|
| SSL via Let's Encrypt | OK |
| HTTP -> HTTPS redirect | OK |
| `no-cache` on `index.html` | OK |
| 1-year immutable cache on Vite assets | OK |
| 200MB upload limit for videos | OK |
| EC2 raw IP in `server_name` | Low risk — bypasses domain TLS on direct IP access |

### AWS S3 — `server/src/config/s3.js`
| Check | Status |
|-------|--------|
| Presigned PUT URLs — 15 min expiry | OK |
| IAM Role auth — no credentials in code | OK |
| Region: `ap-south-2` (Hyderabad) | OK |
| **Verify: Block Public Access enabled on S3 bucket** | ACTION REQUIRED |

---

## 8. What Is Done Well

| Feature | Implementation |
|---------|---------------|
| Razorpay HMAC Verification | HMAC-SHA256 + live capture confirmation from Razorpay REST API |
| MySQL Transaction Locking | BEGIN/COMMIT/ROLLBACK + FOR UPDATE row locks on all payout operations |
| Android SurfaceView Fix | VideoView mounted only when `isActive && isScreenFocused` |
| Ad Redirect Safety | Rejects `funflick.in` variants and empty actionUrl |
| Auto Subscription Expiry | Checked on every auth request; auto-downgrades expired accounts |
| Auto Account Unsuspension | Lifted automatically when `suspended_until` timestamp passes |
| FlatList Performance | `windowSize=3`, `maxToRenderPerBatch=2`, `removeClippedSubviews` on Android |
| OTP Registration | 2-step email OTP with 10-minute expiry |
| Multi-Account Login | Instagram-style account chooser for shared email/phone |

---

## 9. iOS Build Readiness Assessment

| Checklist Item | Status |
|----------------|--------|
| `bundleIdentifier`: `com.funflick.app` | OK |
| `version`: `1.0.17` | OK |
| `buildNumber` set | MISSING — add `"18"` |
| App icon 1024x1024 PNG | Need to verify |
| Splash screen asset | OK (`./assets/splash-icon.png`) |
| `expo-video` plugin | OK |
| `expo-notifications` plugin | OK |
| `NSPhotoLibraryUsageDescription` | OK |
| `NSCameraUsageDescription` | OK |
| Apple Developer Account | Confirm active membership |
| iOS Distribution Certificate | Need to generate/verify via EAS |
| Provisioning Profile | Need to generate/verify via EAS |
| Associated Domains (`applinks:funflick.in`) | OK |
| EAS iOS build profile in `eas.json` | MISSING |

---

## 10. Fix Priority Matrix

| Priority | Issue ID | Description | Effort |
|----------|----------|-------------|--------|
| P0 — Immediate | CRITICAL-001 | Fix SSRF + streaming in media proxy | 30 min |
| P0 — Immediate | HIGH-002 | Move PEM/CSV/KYC files out of workspace | 10 min |
| P1 — Before iOS Build | REPO-003 | Add `buildNumber` to iOS config | 5 min |
| P1 — Before iOS Build | REPO-004 | Add iOS profile to `eas.json` | 15 min |
| P1 — This Week | HIGH-001 | Add rate limiting to view recording | 1 hour |
| P2 — This Sprint | HIGH-003 | Remove default credential fallbacks | 30 min |
| P2 — This Sprint | MEDIUM-001 | Restrict CORS to known origins | 15 min |
| P2 — This Sprint | MEDIUM-002 | Set `usesCleartextTraffic: false` | 5 min |
| P3 — Maintenance | REPO-001 | Add `.gitattributes` for line endings | 10 min |
| P3 — Maintenance | REPO-002 | Reinstall `node_modules` on macOS | 5 min |
| Pending | REPO-DIFF | Commit payoutController.js + deploy to EC2 | 15 min |

---

## Appendix — Key File References

| Component | File |
|-----------|------|
| Backend Entry | `server/src/server.js` |
| App Bootstrap | `server/src/app.js` |
| Database Schema | `server/src/config/db.js` |
| Auth Middleware | `server/src/middlewares/authMiddleware.js` |
| Media Download (SSRF) | `server/src/controllers/mediaController.js` |
| View Recording | `server/src/controllers/videoController.js` L492 |
| Payment Verification | `server/src/controllers/subscriptionController.js` |
| Payout System | `server/src/controllers/payoutController.js` |
| Mobile API Client | `mobile/src/services/api.js` |
| Mobile S3 Upload | `mobile/src/services/s3Upload.js` |
| Mobile Navigation | `mobile/src/navigation/AppNavigator.js` |
| NGINX Config | `nginx-funflick.conf` |
| EAS Config | `mobile/eas.json` |
| App Config | `mobile/app.json` |

---

*Auto-generated by Antigravity AI Code Audit — October 24, 2026. Verify all findings before applying to production.*
