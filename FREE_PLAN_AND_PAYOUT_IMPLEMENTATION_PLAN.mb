# Updated Implementation Plan: Free Influencer Plan (Option 1: Admin-Controlled), Creation-Flow Payout Prompts & Admin Panel Fixes

## 1. Executive Summary & Strategy
* **Selected Architecture (Option 1):** The Free Influencer Pass stays **active continuously** for users until and unless the Admin deletes or deactivates it from the Admin **Manage Subscriptions** page.
* **Removal Master Switch:** When the Admin deletes or turns off the Free Plan in Manage Subscriptions, the backend immediately executes a cascading update to cancel the free tier across **all user accounts** (`is_influencer = 0, subscription_plan = NULL`).
* **Creation-Flow Payout Gating (Story, Reel, Post):** When an unverified creator tries to post a **Story**, **Reel**, or **Post** from the user panel, the app prompts them to enter their **PhonePe UPI ID** or **Bank details** to activate their **Free Influencer Pass** so they can receive payouts for their content.
* **Admin Manage Subscriptions Fixes:** 
  1. Fix the validation bug preventing `₹0` prices (allowing free promotional tiers).
  2. Fix duration and description editing in the modal.
  3. Deactivate paid plans (`weekly`, `monthly` set to `active = 0`) on MySQL so only the Free Plan is visible to users right now.
* **Android Build (v1.0.19, versionCode 20):** Built with dynamic plan fetching. In the future, when the payment gateway is live and Admin adds/enables paid plans in the Admin Panel, user devices will dynamically fetch them without needing another app update!
* **iOS App:** Stays **100% UNTOUCHED** (`buildNumber: 18`).

---

## 2. Implementation Roadmap

```mermaid
flowchart TD
    subgraph Step 1: Admin Manage Subscriptions & Database Fixes
        A1["AdminSubscriptionsScreen.jsx: Allow ₹0 price, fix duration & description editing"]
        A2["subscriptionController: Update updatePlanAdmin for ₹0 and duration/description"]
        A3["subscriptionController: Update deletePlanAdmin to revoke users' influencer status immediately"]
        A4["MySQL EC2: Deactivate 'weekly' & 'monthly' (active = 0); reset 3650-day test accounts"]
    end

    subgraph Step 2: User Creation Flow Gating (Web & Mobile)
        B1["Web: Prompt payout modal when user tries to post Reel, Story, or Post"]
        B2["Mobile: Prompt payout modal when user taps + to create Reel, Story, or Post"]
        B3["Ensure causal viewers browsing feeds are never interrupted"]
    end

    subgraph Step 3: Subscription Screen Display Cleanup
        C1["Web & Mobile SubscriptionScreen: Show 'Active Creator Tier (Promotional)'"]
        C2["Remove confusing '3650 days' / 10-year countdown"]
    end

    subgraph Step 4: Web Deployment & Verification (Stage 1)
        D1["Build Web Client & Deploy to AWS EC2 (/var/www/funflick-web/)"]
        D2["Deploy Backend to EC2 & Restart PM2"]
        D3["Verify Admin Subscriptions page editing & user activation"]
    end

    subgraph Step 5: Android Build & Release (Stage 2)
        E1["Verify mobile/app.json: version 1.0.19, versionCode 20, iOS untouched"]
        E2["Run EAS Build for Android production .aab"]
        E3["Deliver .aab link for Google Play Console upload"]
    end

    Step 1 --> Step 2
    Step 2 --> Step 3
    Step 3 --> Step 4
    Step 4 --> Step 5
```

---

## 3. Detailed Component Breakdown

### Task 1: Admin Panel Fixes (`AdminSubscriptionsScreen.jsx` & Backend)
1. **Fix Price Validation in `AdminSubscriptionsScreen.jsx`:**
   - Change `if (Number(editingPlan.price) <= 0)` $\rightarrow$ `if (Number(editingPlan.price) < 0)`.
   - Change `<input min="1" ... />` $\rightarrow$ `min="0"`.
   - Allows saving `₹0` for free plans without error.
2. **Fix Duration and Description Updates:**
   - In `AdminSubscriptionsScreen.jsx`, ensure custom duration strings (e.g. `30 Days`, `Lifetime`, `Ongoing`) and descriptions are not overwritten by automatic period presets.
   - In `subscriptionController.js:updatePlanAdmin`, properly handle `price: 0`, custom `duration`, and `description` in MySQL update query.
3. **Cascading Influencer Revocation on Plan Deletion:**
   - In `deletePlanAdmin` (`server/src/controllers/subscriptionController.js`):
     ```javascript
     // Revoke influencer status from all users on this plan
     await pool.query(
       'UPDATE users SET is_influencer = 0, subscription_plan = NULL, subscription_expires_at = NULL WHERE subscription_plan = ? OR subscription_plan = "Free Influencer Pass"',
       [planName]
     );
     // Delete the plan
     await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
     ```
   - When Admin deletes the free plan, **all user accounts immediately have their free influencer status cancelled**.
4. **Deactivate Paid Plans in Database:**
   - Run SQL on EC2:
     ```sql
     UPDATE subscription_plans SET active = 0 WHERE id IN ('weekly', 'monthly');
     UPDATE subscription_plans SET duration = 'Ongoing', description = 'Free creator monetization pass. Earn cash rewards from Admin for views & likes.' WHERE id = 'free_influencer';
     ```

---

### Task 2: Creator Creation Flow Prompts (Story, Reel, Post)

#### Web Platform (`src/pages/user/create/`):
1. **`UploadVideoScreen.jsx` (Reels & Videos):**
   - If creator has `!currentUser?.hasPayoutDetails`:
     - Display a prominent banner and open `CreatorPayoutDetailsModal`:
       > *"🎉 Activate your Free Influencer Pass to get cash rewards for views & likes on this reel!"*
2. **`CreateStoryScreen.jsx` (Stories):**
   - When user clicks "Publish Story", if `!currentUser?.hasPayoutDetails`:
     - Open `CreatorPayoutDetailsModal` so they can enter PhonePe UPI / Bank details before publishing.
3. **`CreatePostScreen.jsx` (Standard Photo/Text Posts):**
   - When user clicks "Publish Post", if `!currentUser?.hasPayoutDetails`:
     - Open `CreatorPayoutDetailsModal` to activate their Free Influencer Pass.

#### Mobile Platform (`mobile/src/screens/create/`):
1. **`CreateChooserModal.js` (+ Button on Home / Navigation):**
   - When user taps "+", if `!currentUser?.hasPayoutDetails`:
     - Show payout prompt or badge: *"Activate Free Influencer Pass to earn on your upload"*.
2. **`UploadReelScreen.js`, `CreatePostScreen.js`, `CreateStoryScreen.js`:**
   - Check `!currentUser?.hasPayoutDetails` on mount / publish.
   - Open `CreatorPayoutDetailsModal` sheet so they can enter PhonePe UPI or Bank details.
   - Saving activates their Free Plan immediately with celebration alert.

---

### Task 3: Subscription Screen Display Cleanup (No More 3650 Days)
* Both on **Web (`SubscriptionScreen.jsx`)** and **Mobile (`SubscriptionScreen.js`)**:
  - Replace the 3650 days countdown with:
    - **Status:** `ACTIVE & VALID`
    - **Tier:** `Active Creator Pass (Promotional Free Tier)`
    - **Notice:** `Active while promotion is live. Payouts enabled for views & likes.`
  - This removes the confusing 10-year / 2036 expiry date, presenting a clean, professional creator status.

---

### Task 4: Deployment & Verification Order

1. **Stage 1: Web & Admin Panel Verification**
   - Apply Admin Subscriptions screen fixes.
   - Deploy backend and `dist/` web build to AWS EC2.
   - Verify on `https://funflick.in`:
     - Test editing a plan in `/admin/subscriptions` (change amount, days, description).
     - Test posting a Reel, Story, and Post $\rightarrow$ verify payout details modal prompts properly.
     - Test deleting/deactivating the free plan $\rightarrow$ verify user influencer status is cancelled.
2. **Stage 2: Android Mobile App & `.aab` Build**
   - Test mobile creation flow prompt.
   - Verify `mobile/app.json`: `version: "1.0.19"`, `versionCode: 20` (iOS untouched).
   - Trigger production `.aab` build via EAS.
   - Provide direct `.aab` download link for Google Play Console.

---

### Task 5: Future Payment Gateway Transition
When you are ready to activate Razorpay/Cashfree:
1. Open Admin Panel $\rightarrow$ **Manage Subscriptions**.
2. Delete or toggle `active = 0` on the Free Plan $\rightarrow$ all free influencer statuses are revoked automatically.
3. Toggle `active = 1` on the Paid Plans (₹99 Weekly, ₹199 Monthly).
4. Both the Web and Android apps dynamically fetch the Paid Plans immediately.
5. Users see paid plans and pay via Razorpay/Cashfree with **zero app updates needed**.
