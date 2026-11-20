# Implementation Plan: Android v1.0.18 (Crash Fix + Full Feed Pagination & Refresh + Android App Links & Play Store Redirect)

**Target Release:** Android `1.0.18` (`versionCode: 19`) for Google Play Store
**Package Name:** `com.funflick.app`
**App Store Impact:** **Zero impact right now** (no iOS build needed). **100% compatible** with future iOS App Store builds when Muzammil builds later.

---

## 🛡️ How This Works Safely for Play Store Now & App Store Later

| Question | How It Is Handled |
| :--- | :--- |
| **Will the live App Store (iPhone) app be affected right now?** | **No.** The live iPhone app only changes if a new iOS build is uploaded to Apple. And the server update uses an *optional* `seed` parameter—when the current iPhone app calls `/api/videos` without `seed`, the server responds with the exact same behavior as before. |
| **What happens in future App Store builds?** | **It updates cleanly with zero issues.** Pagination ("load more"), Home refresh, and deep link routing work in pure JavaScript (`AppContext.js`, `HomeScreen.js`, `ReelsScreen.js`, `AppNavigator.js`). The next time an iOS build is created, iPhone users will automatically get the 200+ video scrolling and refresh improvements too, while the hardware decoder limit and Android App Links stay scoped to Android. |

---

## 🛠️ Issue 1: Android App Exiting After 4–5 Videos (Android-Only Fix)

### Root Cause
Every rendered reel in the `FlatList` keeps a live `useVideoPlayer(mediaUrl)` instance in memory, plus background players on the Home tab. After 4–5 videos, Android hits its hardware `MediaCodec` decoder limit and the OS kills the app.

### Changes
1. **[NEW] `mobile/src/utils/videoPlayerPolicy.js`**
   * Central helper `getManagedVideoSource({ isVideo, mediaUrl, isActive, isFocused, shouldPreload })`.
   * On **iOS**: returns `mediaUrl` unchanged.
   * On **Android**: returns `mediaUrl` **only** when the screen is focused and the item is active (or is the very next item `currentIndex + 1` for smooth preloading). For all other off-screen items, it returns `null` so `expo-video` immediately releases the native Android hardware decoder.

2. **[MODIFY] `mobile/src/screens/feed/ReelsScreen.js`**
   * Pass `getManagedVideoSource(...)` into `useVideoPlayer` inside `ReelItem` (with `shouldPreload={index === currentIndex + 1}`).
   * On `FlatList`: set `windowSize={Platform.OS === 'android' ? 3 : 5}` and `removeClippedSubviews={Platform.OS === 'android'}`.

3. **[MODIFY] `mobile/src/screens/media/VideoDetailScreen.js`**
   * Pass `shouldPreload={index === currentIndex + 1}` to `ReelItem` and apply the same Android-only `FlatList` memory props.

4. **[MODIFY] `mobile/src/components/feed/SponsoredAdCard.js`**
   * Use `getManagedVideoSource(...)` so off-screen video ads on the Home tab hold zero decoders.
   * Move the early `if (!ad || isPaidInfluencer) return null;` check below all React hooks so hook order never changes.

---

## 🔄 Issue 2: Home Refresh Showing Same Content & Only 25–50 Videos Visible (All 200+ Videos Fix)

### Root Cause
* **Home Screen:** Calls `/videos` once (capped at 50 newest items), never paginates on scroll, and always returns the exact same fixed `created_at DESC` list on pull-to-refresh.
* **Videos (`ReelsScreen`) Tab:** Fetches only 25 items (`limit=25`) with no `onEndReached` pagination, stopping after 25 videos instead of loading all ~200 videos.

### Changes

#### A. Server (Backward-Compatible Optional Seeded Shuffle)
1. **[MODIFY] `server/src/controllers/videoController.js`** (`listVideos`)
   * Keep the default behavior 100% unchanged when `seed` is not passed (so the live iPhone app, website, and profile pages are untouched).
   * When an optional `seed` query parameter is provided (e.g. `GET /api/videos?limit=25&offset=0&seed=12345`), order using deterministic seeded shuffle (`ORDER BY RAND(?)`) so pull-to-refresh gives a fresh mix of posts while `offset` pagination walks through all 200+ posts without duplicates.

#### B. Mobile App — Home Feed Refresh & Infinite Scroll
2. **[MODIFY] `mobile/src/context/AppContext.js`**
   * Update `fetchFeed({ refresh, loadMore })`:
     * Maintain `feedSeedRef`, `feedOffsetRef`, `hasMoreFeed`, and `isLoadingMoreFeed`.
     * **On Pull-to-Refresh:** Generate a new `seed`, reset `offset = 0`, and fetch the first page (`limit = 25`) so the user immediately sees fresh content at the top of "For You".
     * **On Scroll to Bottom (`loadMoreFeed`):** Fetch the next page (`offset += 25`) with the same `seed` and append new posts (deduplicated by `id`) until all 200+ posts are loaded.
     * Preserve `createdAt: v.created_at` on mapped post objects so the **"Latest"** tab always sorts newest-first accurately.

3. **[MODIFY] `mobile/src/screens/feed/HomeScreen.js`**
   * Wire `onEndReached={loadMoreFeed}` and `onEndReachedThreshold={0.5}` on the `FlatList`.
   * Add a lightweight loading spinner in `ListFooterComponent` when fetching the next batch.
   * Update `handleRefresh` to call `fetchFeed({ refresh: true })`.

#### C. Mobile App — Videos (`ReelsScreen`) Infinite Scroll for All 200+ Videos
4. **[MODIFY] `mobile/src/screens/feed/ReelsScreen.js`**
   * Store `reelsSeedRef`, `reelsOffsetRef`, `hasMoreReels`, and `isLoadingMoreReels`.
   * **Initial Load & Pull-to-Refresh:** Fetch `limit=25&offset=0&seed=<newSeed>`, resetting the list with a fresh order.
   * **On Scroll Near Bottom (`onEndReached`):** Automatically call `/videos/reels?limit=25&offset=<nextOffset>&seed=<sameSeed>` and append unseen videos (deduplicated by `id`) so users can scroll seamlessly through all 200+ videos without stopping at 25.

---

## 🔗 Issue 3: Android App Links, Deep Linking & Google Play Store Redirect (`com.funflick.app`)

### Root Causes Found
1. **Missing `assetlinks.json`:** `https://funflick.in/.well-known/assetlinks.json` currently returns `index.html` (`text/html`) instead of a JSON Digital Asset Links file. Because of this, Android's domain verification (`autoVerify: true`) fails and links open in the browser instead of the app.
2. **Mixed Custom Scheme in `autoVerify` Intent Filter:** In `mobile/app.json`, `"scheme": "funflick"` is inside the same `intentFilters` block as `"autoVerify": true` `https` hosts. On Android 12+, mixing custom schemes with `autoVerify: true` can cause domain verification to fail. Also, paths like `/`, `/videos`, `/feed`, and `/discover` were missing from the filter.
3. **Cold-Start Splash Screen Override:** In `mobile/src/screens/auth/SplashScreen.js`, `navigation.replace('MainTabs')` runs unconditionally on app launch, overriding incoming deep links (`/video/:id`, `/profile/:username`) when the app is opened from a closed state.
4. **No Play Store Fallback When App is Not Installed (or in WhatsApp/Instagram/Facebook WebViews):** When a user on Android clicks a shared link (`https://funflick.in/video/123` or `https://funflick.in/profile/...`) without the app installed (or inside Instagram/Facebook in-app browsers), the web page did not trigger an Android `intent://` redirect with `S.browser_fallback_url` to send uninstalled users to `https://play.google.com/store/apps/details?id=com.funflick.app`.

### Changes

1. **[NEW] `public/.well-known/assetlinks.json` & [MODIFY] `nginx-funflick.conf` + `server/src/app.js`**
   * Create `public/.well-known/assetlinks.json` for `package_name: "com.funflick.app"` with `relation: ["delegate_permission/common.handle_all_urls"]` and the SHA-256 certificate fingerprints (upload keystore SHA-256 + Google Play App Signing SHA-256).
   * Add an explicit `/.well-known/assetlinks.json` route in `nginx-funflick.conf` (and `server/src/app.js` fallback) with `Content-Type: application/json` so Android's verifier always receives valid JSON, never `index.html`.

2. **[MODIFY] `mobile/app.json` (Android `intentFilters`)**
   * Split `intentFilters` into two clean blocks:
     * **Block 1 (`autoVerify: true` — Android App Links):** `https` and `http` for `funflick.in` and `www.funflick.in` matching `/` (all paths including `/video`, `/videos`, `/reels`, `/profile`, `/feed`, `/discover`).
     * **Block 2 (`autoVerify: false` — Custom URI Scheme):** `scheme: "funflick"` for `funflick://` deep links (OAuth callback, payment return, custom app triggers).

3. **[MODIFY] `mobile/src/navigation/AppNavigator.js` & `mobile/src/screens/auth/SplashScreen.js`**
   * Add route mappings in `AppNavigator.js` for `reels: 'reels'` (mapping to `Videos` tab) in addition to `video/:videoId`, `profile/:username`, `feed`, `videos`, `discover`.
   * Update `SplashScreen.js` to check `Linking.getInitialURL()` before calling `navigation.replace('MainTabs')` so cold-start deep links open the exact shared video or profile instead of being overwritten by the home screen.

4. **[MODIFY] `src/pages/user/VideoDetailScreen.jsx` & `src/pages/user/CreatorProfileScreen.jsx` (Web Deep Link + Play Store Redirect)**
   * When an Android user opens a shared FunFlick link (`https://funflick.in/video/:id` or `https://funflick.in/profile/:username`) in WhatsApp, Instagram, Facebook, or mobile browser:
     * Automatically trigger the official Android Intent URI:
       `intent://funflick.in/<path>#Intent;scheme=https;package=com.funflick.app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.funflick.app;end`
     * **If the app IS installed:** Opens the FunFlick app directly to that video or profile (even from inside Instagram/Facebook in-app browsers).
     * **If the app is NOT installed:** Automatically redirects the user to **Google Play Store** (`https://play.google.com/store/apps/details?id=com.funflick.app`).
     * Update the "Open App" banner button on mobile web to also use this intent / Play Store fallback.

---

## 📦 Issue 4: Android Version Bump
1. **[MODIFY] `mobile/app.json`**
   * Bump `version` to `"1.0.18"` and `android.versionCode` to `19` (leaving `ios.buildNumber` untouched at `"18"`).

---

## ✅ Verification Checklist
1. **Syntax & Diagnostics:** Run `node -c` on modified server files and verify all modified mobile/web files have zero syntax or lint errors.
2. **Android Player Cap:** Confirm only active + next video hold a `mediaUrl` on Android while off-screen items pass `null`.
3. **Pagination & Refresh:** Verify Home pull-to-refresh generates a new seed and changes top "For You" posts, "Latest" sorts newest first, and scrolling down on both Home and Videos loads pages 2, 3, 4… until all 200+ videos are shown.
4. **Android App Links & Play Store Fallback:**
   * Verify `/.well-known/assetlinks.json` contains valid JSON for `com.funflick.app`.
   * Verify `mobile/app.json` has separated `autoVerify: true` HTTPS App Links and `funflick://` custom scheme filters.
   * Verify clicking a shared link opens the app when installed, and redirects to Google Play Store (`id=com.funflick.app`) when not installed.
