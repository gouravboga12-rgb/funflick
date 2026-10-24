# FunFlick iOS App — Complete Build & Submission Plan

**Prepared:** October 24, 2026  
**App:** FunFlick  
**Bundle ID:** `com.funflick.app`  
**Target Version:** `1.0.17` (buildNumber `18`)  
**Tool:** Expo EAS Build (Cloud Build)

---

## Overview

This document provides a complete step-by-step plan to build, sign, and submit FunFlick to the Apple App Store using EAS Build. The Android pipeline is already working. This plan mirrors that setup for iOS.

---

## Phase 1 — Prerequisites (Before Anything Else)

### 1.1 — Apple Developer Account

You need an **active Apple Developer Program membership** ($99/year).

- Go to: https://developer.apple.com/account
- Ensure membership is **Active** (not expired)
- Note your **Team ID** (visible in Membership tab, e.g. `ABCD123456`)

### 1.2 — Install / Update EAS CLI

```bash
npm install -g eas-cli@latest
eas --version   # Should be >= 14.0.0
```

### 1.3 — Login to EAS

```bash
eas login
# Enter: gouravboga64 / helishboom@gmail.com credentials
eas whoami      # Should print: gouravboga64
```

---

## Phase 2 — Fix `app.json` for iOS

### 2.1 — Add Missing `buildNumber` (REQUIRED)

Open `mobile/app.json` and update the iOS section:

```json
{
  "expo": {
    "name": "FunFlick",
    "slug": "funflick",
    "version": "1.0.17",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.funflick.app",
      "buildNumber": "18",
      "associatedDomains": [
        "applinks:funflick.in",
        "applinks:www.funflick.in"
      ],
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "FunFlick requires access to your photo and video gallery so you can upload viral reels, posts, and stories.",
        "NSCameraUsageDescription": "FunFlick requires camera access so you can record videos and snap photos directly within the app.",
        "NSMicrophoneUsageDescription": "FunFlick requires microphone access to record video audio for your reels and stories."
      }
    }
  }
}
```

> **Note:** `NSMicrophoneUsageDescription` is required on iOS when using camera. Add it now to avoid App Store rejection.

### 2.2 — Verify Icon Asset

iOS requires a single 1024×1024 PNG icon with **no alpha channel** (no transparency) and **no rounded corners** (Apple applies rounding automatically).

```bash
# Check current icon
ls -la mobile/assets/icon.png
file mobile/assets/icon.png

# Verify size and no alpha using ImageMagick (if installed)
identify -verbose mobile/assets/icon.png | grep -E "Geometry|Alpha|Type"
```

If the icon has alpha, use Preview.app or Photoshop to export as PNG-24 (no transparency) and replace `mobile/assets/icon.png`.

---

## Phase 3 — Update `eas.json` for iOS

Update `mobile/eas.json` to add the iOS production profile:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "credentialsSource": "remote",
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      },
      "ios": {
        "credentialsSource": "remote",
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

**Why `credentialsSource: "remote"` for iOS:**
- EAS manages the Distribution Certificate and Provisioning Profile automatically via Apple APIs
- Much simpler than the Android local keystore approach
- EAS stores credentials securely in Expo's vault

**Why keep `"local"` for Android:**
- Android keystore already exists and is working for Play Store — don't change it

---

## Phase 4 — iOS Credentials Setup (EAS Managed)

Run this from the `mobile/` directory:

```bash
cd /Users/rangolieshwari/Downloads/FunFlick/mobile

# This command automatically:
# 1. Creates an iOS Distribution Certificate in your Apple account
# 2. Creates an App ID (com.funflick.app) in Apple Developer Portal
# 3. Creates an App Store Provisioning Profile
# 4. Stores all credentials securely in EAS vault
eas credentials --platform ios
```

Follow the prompts:
- Select "production" profile
- Log in to Apple with your Apple ID when prompted
- Allow EAS to create/manage credentials automatically

---

## Phase 5 — App Store Connect Setup

### 5.1 — Create the App Record

1. Go to: https://appstoreconnect.apple.com
2. Click **"My Apps"** → **"+" → "New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** FunFlick
   - **Primary Language:** English (India) or Hindi
   - **Bundle ID:** `com.funflick.app`
   - **SKU:** `funflick-ios-001` (any unique string)
4. Click **Create**
5. Note the **Apple ID** of the app (10-digit number shown in App Information)

### 5.2 — App Store Listing Content

Prepare these before submission:

| Content | Details |
|---------|---------|
| **App Name** | FunFlick |
| **Subtitle** | Short Videos & Creator Rewards |
| **Category** | Entertainment (Primary), Social Networking (Secondary) |
| **Description** | 4000 chars max — describe the platform |
| **Keywords** | short video, reels, creator, influencer, india, funflick |
| **Support URL** | https://funflick.in/support (or mailto:support@funflick.in) |
| **Privacy Policy URL** | https://funflick.in/privacy |
| **Screenshots** | See Section 5.3 |
| **App Preview Video** | Optional but recommended — 15-30 second screen recording |

### 5.3 — Screenshots Required

iPhone screenshots are **mandatory**. iPad is optional (since `supportsTablet: false`).

| Device | Resolution | Quantity |
|--------|-----------|---------|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320×2868 or 1290×2796 | Minimum 3, up to 10 |
| iPhone 6.7" (iPhone 15 Plus) | 1284×2778 | Optional |
| iPhone 6.5" (iPhone 11 Pro Max) | 1242×2688 | Optional |

**Recommended screens to capture:**
1. Home Feed (video/reel view)
2. Reels vertical scroll
3. Creator Profile
4. Wallet / Earnings screen
5. Subscription plans

> Use the iOS Simulator in Xcode or a physical iPhone. Take screenshots from the running EAS development build.

---

## Phase 6 — Build the iOS App

### 6.1 — First-Time / Full Build (recommended for App Store)

```bash
cd /Users/rangolieshwari/Downloads/FunFlick/mobile

# Build for App Store submission
eas build --platform ios --profile production
```

**What happens:**
- EAS uploads your code to Expo's build servers
- Uses your Apple credentials to sign the `.ipa`
- Produces a signed `.ipa` ready for App Store Connect
- Build typically takes 15-30 minutes on EAS cloud

**Monitor build:**
- View live logs at: https://expo.dev/accounts/gouravboga64/projects/funflick/builds
- Or watch in terminal — EAS streams build output

### 6.2 — Test Build First (Recommended)

Before spending time on a production build, test on a real device:

```bash
# Build a preview .ipa for internal distribution (TestFlight or direct install)
eas build --platform ios --profile preview
```

---

## Phase 7 — Submit to App Store

### Option A — Direct EAS Submit (Easiest)

```bash
cd /Users/rangolieshwari/Downloads/FunFlick/mobile

eas submit --platform ios --latest
```

This automatically takes the latest build and submits it to App Store Connect via the Apple Transporter API.

### Option B — Manual Upload (if Option A fails)

1. Download the `.ipa` from the EAS builds page
2. Open **Transporter.app** on your Mac (free from Mac App Store)
3. Drag the `.ipa` into Transporter
4. Click **Deliver**
5. Then go to App Store Connect → Activity → Processing (takes 5-30 mins)

---

## Phase 8 — App Store Review Submission

After the build appears in App Store Connect:

1. Go to **My Apps** → **FunFlick** → **iOS App** → **1.0.17**
2. Select the build you uploaded
3. Fill in:
   - **Version Release:** Manually release (recommended for control)
   - **What's New:** Describe v1.0.17 changes
   - **Age Rating:** Fill out the questionnaire (likely 12+ for social content)
   - **Content Rights:** Confirm you own or have rights to all content
   - **Advertising Identifier (IDFA):** Select "No" if not using ad tracking
4. Click **"Submit to App Review"**

**Review Timeline:** Apple typically reviews in 1-3 business days (can be up to 7 days for first submission).

---

## Phase 9 — Common iOS-Specific Issues to Resolve Pre-Build

### 9.1 — Microphone Permission (Missing in current `app.json`)

Add `NSMicrophoneUsageDescription` to iOS infoPlist (shown in Phase 2.1). Apple rejects apps that use camera for video without this.

### 9.2 — expo-video on iOS

`expo-video` with `surfaceType="surfaceView"` is Android-only. On iOS, expo-video uses AVPlayer automatically. The current `StoryViewerScreen.js` and `ReelsScreen.js` have `Platform.OS`-based checks — verify these work correctly on a physical iPhone.

**Test checklist for iOS video:**
- [ ] Reels play with sound on iPhone
- [ ] Video pauses when scrolled off screen
- [ ] Video resumes when scrolled back into view
- [ ] No black screen on first load
- [ ] ExoPlayer-specific code paths don't crash (they should be guarded by `Platform.OS === 'android'`)

### 9.3 — Push Notifications on iOS

expo-notifications on iOS requires:
1. APNs (Apple Push Notification service) certificate — EAS manages this
2. User permission prompt at runtime — already handled by `pushService.js`
3. Test on a **physical device** — iOS Simulator does NOT receive push notifications

### 9.4 — `expo-web-browser` OAuth Callback on iOS

Google OAuth uses `WebBrowser.openAuthSessionAsync()` which on iOS opens Safari View Controller. Verify the `funflick://auth/callback` deep link is correctly registered and intercepted on iOS. Test the full Google sign-in flow on iPhone.

### 9.5 — Safe Area on iPhone with Dynamic Island/Notch

`useSafeAreaInsets` from `react-native-safe-area-context` must be applied correctly on all screens. Check notch and Dynamic Island screens on iPhone 15 Pro series.

### 9.6 — Associated Domains (Deep Linking)

`applinks:funflick.in` is configured in `app.json`. For this to work:
1. The Apple App Site Association file must be at: `https://funflick.in/.well-known/apple-app-site-association`
2. Check if this file exists on your web server: `curl https://funflick.in/.well-known/apple-app-site-association`

If it doesn't exist, add it to the NGINX-served static files.

---

## Phase 10 — iOS Build Command Summary

```bash
# Navigate to mobile directory
cd /Users/rangolieshwari/Downloads/FunFlick/mobile

# Step 1: Verify EAS login
eas whoami

# Step 2: Fix app.json (add buildNumber: "18", NSMicrophoneUsageDescription)
# (Edit manually)

# Step 3: Update eas.json (add iOS production profile)
# (Edit manually)

# Step 4: Setup iOS credentials
eas credentials --platform ios

# Step 5: Build for App Store
eas build --platform ios --profile production

# Step 6: Submit to App Store Connect
eas submit --platform ios --latest

# Check build status
eas build:list --platform ios --limit 5
```

---

## Quick Reference Checklist

Before running the build command, verify:

- [ ] `buildNumber: "18"` added to iOS in `app.json`
- [ ] `NSMicrophoneUsageDescription` added to iOS infoPlist
- [ ] `eas.json` iOS production profile added with `credentialsSource: "remote"`
- [ ] `eas whoami` returns `gouravboga64`
- [ ] Apple Developer Account membership is Active
- [ ] App record created in App Store Connect
- [ ] App Store screenshots prepared (6.9" iPhone)
- [ ] Privacy Policy URL live at `https://funflick.in/privacy`
- [ ] `apple-app-site-association` file on web server

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| Phase 2 | Fix `app.json` | 15 min |
| Phase 3 | Update `eas.json` | 10 min |
| Phase 4 | iOS credentials setup | 10 min |
| Phase 5 | App Store Connect setup + screenshots | 2-4 hours |
| Phase 6 | EAS build | 20-30 min (cloud) |
| Phase 7 | Submit | 10 min |
| Phase 8 | Apple review | 1-3 business days |
| **Total active work** | | **~4-5 hours** |
| **Total wall-clock** | | **2-4 days** |

---

*FunFlick iOS Build Plan — Prepared October 24, 2026*
