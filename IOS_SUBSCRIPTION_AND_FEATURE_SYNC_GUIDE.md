# FunFlick iOS App Store Synchronization Guide: Subscription Plans, Creator Monetization & Recent Feature Updates

> **Target Audience:** iOS Development Team  
> **Repository:** `gouravboga12-rgb/funflick` (branch: `main`, commit: `ecdced0`)  
> **Purpose:** Detailed specification of recent changes deployed to the FunFlick Web platform and Google Play Store Android app (v1.0.22, build 23), with instructions for mirroring these features cleanly into the Apple App Store iOS app while remaining 100% compliant with Apple App Store Review Guidelines.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Subscription Architecture: Free Influencer Pass](#2-subscription-architecture-free-influencer-pass)
3. [Backend API Specifications](#3-backend-api-specifications)
4. [User Creation-Flow Payout Gating (Reels, Posts, Stories)](#4-user-creation-flow-payout-gating-reels-posts-stories)
5. [Apple App Store Review Guidelines Compliance (Crucial)](#5-apple-app-store-review-guidelines-compliance-crucial)
6. [Wallet & Payout Ledger UI Improvements](#6-wallet--payout-ledger-ui-improvements)
7. [Story Deletion & Real-Time Sync Fixes](#7-story-deletion--real-time-sync-fixes)
8. [Concrete iOS Implementation Checklist](#8-concrete-ios-implementation-checklist)

---

## 1. Executive Summary

Over the recent releases, FunFlick transitioned to an **Admin-Controlled Creator Monetization Model**:
* **Free Influencer Pass ($0 / ₹0):** Unlocked for creators so they can immediately begin earning performance-based cash rewards for views and engagement without an upfront fee.
* **Continuous Validity:** The Free Influencer Pass stays active indefinitely until explicitly revoked or deleted by the Admin in the web Admin Center (`/admin/subscriptions`).
* **Creation Gating:** When an unverified user attempts to post content (Reels, Posts, Stories), they are guided to register their payout destination (PhonePe UPI or Bank Account) which instantly activates their creator status.
* **Play Store Release Status:** Tested, validated, and pushed to the Google Play Store under release **1.0.22 (versionCode 23)**.

---

## 2. Subscription Architecture: Free Influencer Pass

### A. Business Rules
1. **Cost:** ₹0 ($0.00).
2. **Duration:** Displayed as **"Ongoing / Promotional Free Tier"** (no countdown timer, and **no confusing "3650 days" countdown**).
3. **Privileges:**
   - Official Influencer crown badge.
   - Eligibility for Admin-disbursed cash rewards based on video view milestones.
   - Full access to 8-factor audience analytics.
   - Priority review on uploaded reels.
4. **Revocation Master Switch:**
   - If the Admin deactivates or deletes the Free Plan in the web Admin Center, the backend automatically cascades and sets `is_influencer = 0, subscription_plan = NULL` for all users on that tier.

### B. Display Requirements on `SubscriptionScreen`
When the user visits the Subscription screen:
* If the user **already has the pass active**:
  - **Status Badge:** `ACTIVE & VALID` (Emerald / Green)
  - **Plan Title:** `Free Influencer Pass` (or `Active Creator Pass`)
  - **Validity Text:** `Active promotional creator tier. Payouts enabled for verified reel views.`
  - **Action Button:** Replaced with an active confirmation indicator (`✓ Active Creator Tier`).
* If the user **does not have the pass active**:
  - Show the `Free Influencer Pass` card with price **`₹0`**.
  - Clicking **"Activate Free Pass"** prompts for payout details if missing, or activates immediately via `POST /api/subscriptions/activate-free`.

---

## 3. Backend API Specifications

All endpoints are hosted on the live AWS EC2 backend (`https://funflick.in/api`):

### 1. Fetch Subscription Plans
- **Endpoint:** `GET /api/subscriptions/plans`
- **Auth:** Optional / Bearer Token
- **Response:**
  ```json
  {
    "plans": [
      {
        "id": "free_influencer",
        "name": "Free Influencer Pass",
        "label": "Free Starter",
        "price": 0,
        "formatted_price": "₹0",
        "period": "free",
        "durationDays": 3650,
        "description": "Free creator monetization pass. Earn cash rewards from Admin for views & likes.",
        "popular": true,
        "features": [
          "Official Influencer status badge",
          "Eligible for Admin Performance & Video Cash Rewards",
          "Performance analytics (Views, Likes, Comments)",
          "Direct Bank & PhonePe UPI payouts"
        ]
      }
    ]
  }
  ```

### 2. Fetch User Subscription Status
- **Endpoint:** `GET /api/subscriptions/my-status`
- **Auth:** `Bearer <token>`
- **Response:**
  ```json
  {
    "isActive": true,
    "planName": "Free Influencer Pass",
    "isInfluencer": true,
    "startDate": "2026-11-18T10:00:00.000Z",
    "expiresAt": null,
    "daysRemaining": null,
    "hasPayoutDetails": true
  }
  ```

### 3. Activate Free Influencer Pass
- **Endpoint:** `POST /api/subscriptions/activate-free`
- **Auth:** `Bearer <token>`
- **Payload:** `{}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Free Influencer Pass activated successfully",
    "subscription": {
      "plan_name": "Free Influencer Pass",
      "expires_at": null,
      "is_active": true
    }
  }
  ```

### 4. Creator Payout Details Management
- **Fetch Details:** `GET /api/payouts/details`
- **Save / Update Details:** `POST /api/payouts/details`
- **Payload:**
  ```json
  {
    "payoutType": "upi",           // "upi" | "bank" | "both"
    "upiId": "creator@ybl",
    "bankName": "HDFC Bank",       // optional if upi
    "accountNumber": "1234567890", // optional if upi
    "ifscCode": "HDFC0001234",     // optional if upi
    "phoneNumber": "9876543210",
    "emailId": "creator@email.com"
  }
  ```
  *(Saving payout details automatically activates the Free Influencer Pass in the backend).*

---

## 4. User Creation-Flow Payout Gating (Reels, Posts, Stories)

To ensure creators don't post unmonetized content without payout routing:

1. **Trigger Points:**
   - User taps the **`+` (Create)** button in the bottom navigation.
   - User opens `UploadReelScreen`, `CreatePostScreen`, or `CreateStoryScreen`.
2. **Condition:**
   ```javascript
   if (!currentUser?.hasPayoutDetails && !currentUser?.isInfluencer) {
     // Open CreatorPayoutDetailsModal
   }
   ```
3. **Experience:**
   - Present the unified `CreatorPayoutDetailsModal`.
   - Headline: *"🎉 Activate Free Influencer Pass!"*
   - Subhead: *"Enter your PhonePe UPI ID or Bank Account so Admin can disburse cash rewards for views and likes on your content."*
   - Once submitted, update local state:
     ```javascript
     setCurrentUser(prev => ({
       ...prev,
       isInfluencer: true,
       hasPayoutDetails: true,
       subscriptionPlan: 'Free Influencer Pass'
     }));
     ```

---

## 5. Apple App Store Review Guidelines Compliance (Crucial)

When submitting the iOS update to App Store review, the following rules must be strictly adhered to:

### A. Guideline 3.1.1 — In-App Purchase (IAP) vs. External Gateways
> **Warning:** Apple will **immediately reject** any iOS app that links to external payment processors (e.g. Razorpay, Cashfree, Stripe web checkout, external links) for digital subscriptions or digital goods.

* **Android Implementation:**
  Android uses Razorpay via `WebBrowser.openAuthSessionAsync(...)`.
* **iOS Requirement:**
  1. **Free Influencer Pass ($0):** Allowed by Apple without IAP because the cost is $0.00 and no payment gateway is invoked.
  2. **Paid Tiers (Weekly ₹99, Monthly ₹299, Annual ₹1999):**
     - **Option 1 (Recommended for Fast App Store Approval):**
       On iOS, do **not** display paid Razorpay tiers. Only show the **Free Influencer Pass**. Filter plans:
       ```javascript
       const visiblePlans = Platform.OS === 'ios'
         ? plans.filter(p => Number(p.price) === 0)
         : plans;
       ```
     - **Option 2 (Full In-App Purchases):**
       If paid tiers are offered to iOS users, they must be registered in Apple App Store Connect under In-App Purchases and processed using StoreKit (`react-native-iap` or Expo In-App Purchases). **Never launch Razorpay on iOS.**

### B. Outbound Creator Payouts (Compliant with Guideline 5.1.1)
* Collecting a creator's UPI ID or Bank Account for **receiving cash rewards** is categorized as creator disbursement / revenue-share payout.
* This is compliant with Apple policies because money is flowing *to* the user, not being charged *from* the user for app features.

### C. Guideline 4.8 — Sign in with Apple
* Ensure **Sign in with Apple** remains prominent on iOS whenever third-party logins (like Google) are offered. This has already been integrated via `expo-apple-authentication`.

---

## 6. Wallet & Payout Ledger UI Improvements

In the Android app, `WalletScreen.js` suffered from an infinite re-render loop that caused screen blinking. This was resolved as follows:

1. **Memoize Context Callbacks:**
   - In `AppContext.js`, `updateCurrentUser` and `fetchUserData` are wrapped in `useCallback` with value-equality checks so function references do not change on every render.
2. **Separate Background Sync from Initial Loading:**
   - `loadData(showLoading = false)` accepts an optional boolean.
   - Screen focus triggers `loadData(false)` so existing payout history cards remain visible without flickering a full-page spinner.
3. **Unified Payout Modal:**
   - Both Web and Mobile now use `CreatorPayoutDetailsModal` (unified UPI / Bank tab switcher) with clean Indian currency formatting (`₹`).

---

## 7. Story Deletion & Real-Time Sync Fixes

Previously, deleting a story occasionally triggered a *"Delete Failed — Story not found"* popup even though the story was removed.

### Backend Solution (Already Live on EC2):
1. **Idempotent Deletion (`storyController.js`):**
   - If a request attempts to delete a story that has already been deleted (from a double tap or concurrent sync), the backend returns `200 OK: { success: true, message: 'Story deleted successfully' }` instead of `404 Not Found`.
2. **Live Caching Headers:**
   - `GET /api/stories` now sends `Cache-Control: no-store, no-cache, must-revalidate` so that story trays update instantly without stale 304 caching.
3. **iOS Action:**
   - The iOS client will automatically benefit from this backend update without any extra networking work.

---

## 8. Concrete iOS Implementation Checklist

| Task | Component / File | iOS Implementation Requirement |
| :--- | :--- | :--- |
| **1. Free Pass UI** | `SubscriptionScreen` | Display the Free Influencer Pass ($0) prominently. Show active status without 3650-day timer. |
| **2. Payment Safety** | `SubscriptionScreen` | Ensure no Razorpay / external web payment gateway URLs are invoked on iOS. |
| **3. Creation Flow** | `CreateChooserModal`, `UploadReelScreen`, `CreatePostScreen`, `CreateStoryScreen` | If `!currentUser?.hasPayoutDetails`, display `CreatorPayoutDetailsModal` before publish. |
| **4. Payout Modal** | `CreatorPayoutDetailsModal` | Allow entering UPI ID or Bank Account Details, sync with `POST /api/payouts/details`. |
| **5. Wallet Screen** | `WalletScreen` | Prevent re-render loops using memoized callbacks and non-blocking background refreshes. |
| **6. Build Config** | `app.json` | Maintain `ios.buildNumber` increment policy (next build after 18) when ready for TestFlight. |

---

*Document generated on: 20-Nov-2026*  
*Reference Repository Commit:* `ecdced0` (Branch `main`)
