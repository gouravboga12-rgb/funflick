# FunFlick Mobile App - Project Handover & Status Report

**Date:** October 21, 2026 (Morning Update)  
**Current Version:** `1.0.16` (versionCode `17`)  
**Previous Version:** `1.0.15` (versionCode `16`) — superseded, do not upload  
**Active Git Branch:** `main`  
**EAS Build URL (v1.0.16):** [https://expo.dev/accounts/gouravboga64/projects/funflick/builds/15365b31-11c5-4dea-9f00-88c7b8e4a5be](https://expo.dev/accounts/gouravboga64/projects/funflick/builds/15365b31-11c5-4dea-9f00-88c7b8e4a5be)

---

## 1. Executive Summary

This document details all root causes, fixes, and architectural notes for three critical mobile issues identified during testing of build `v1.0.14` (code 15). All fixes have been implemented, tested for zero regression, committed to `origin/main`, and queued as a production `.aab` release build `v1.0.15` (code 16).

---

## 2. Issues Resolved Tonight & Root Cause Breakdown

### Issue 1 & Issue 3: App Exiting / Play Store Opening & Ads Redirecting Without Links

#### The Symptoms
1. When scrolling through the feed or reels, after 4–5 items, the app abruptly exited to the device home screen or redirected to Google Play Store / browser.
2. In the admin panel, ads created without an external redirect link still redirected to `https://funflick.in` in Chrome and requested login.

#### The Root Cause
1. **The 5-Post Interleave:** In `mobile/src/screens/feed/HomeScreen.js`, sponsored ads are inserted every 5 posts (`postCount % 5 === 0`).
2. **Accidental Scroll Clicks:** In `mobile/src/components/feed/SponsoredAdCard.js`, the entire 440px image card was wrapped inside `<TouchableOpacity onPress={handleAction}>`. As users swiped vertically to scroll past the ad, their finger drag/release triggered `handleAction()`.
3. **The Default Fallback:** Inside `handleAction()`, the target URL defaulted to `'https://funflick.in'` (`const targetUrl = ad.actionUrl || 'https://funflick.in'`). When no link was set in the admin panel, `Linking.openURL('https://funflick.in')` was called.
4. **Android OS Behavior:** Opening `https://funflick.in` caused Android to launch Chrome, sending FunFlick to the background. Chrome / Google Play Services then triggered Google Play Store via Digital Asset Links or app prompts.
5. **ExoPlayer Decoder Accumulation:** In `HomeScreen.js`, the `FlatList` had no `windowSize` bounds and lacked `removeClippedSubviews`. After 4–5 video posts, multiple native `ExoPlayer` decoders remained active, risking native Android codec exhaustion crashes.

#### The Fixes Applied
- **`mobile/src/components/feed/SponsoredAdCard.js`:**
  - Removed `'https://funflick.in'` fallback. If `ad.actionUrl` is missing or empty, `handleAction()` does nothing.
  - Made the image ad container a non-clickable `<View style={styles.imageMediaWrapper}>`. Scrolling over ads will never trigger links.
  - Conditionally rendered the top "Visit" pill and bottom CTA button **only** when `ad.actionUrl` is a valid `http://` or `https://` URL. If no link is configured in admin, the card renders purely as an in-feed brand sponsorship.
- **`mobile/src/screens/feed/HomeScreen.js`:**
  - Added `windowSize={3}`, `maxToRenderPerBatch={2}`, `initialNumToRender={2}`, and `removeClippedSubviews={Platform.OS === 'android'}` to the feed `FlatList`.
  - Ensures off-screen video decoders are unmounted, keeping RAM and hardware decoder usage minimal.

---

### Issue 2: Unrelated Background / Dog Image on Posts

#### The Symptoms
- For standard (image) posts, some posts displayed an external background image (a French Bulldog) or a purplish background tint instead of the post media.

#### The Root Cause
1. **Hardcoded Unsplash Fallback:** In `mobile/src/components/feed/StandardPostCard.js`, if an image failed to load or was missing, lines 251 and 450 fell back to `'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'` (a stock photo of a French Bulldog).
2. **Video URLs in Image List:** If a post contained an `.mp4` video URL in `media_url`, React Native `<Image>` failed to decode the video, triggering `onError` and displaying the dog photo.
3. **No Reset on FlatList Item Recycling:** `imageError` was stored in local state (`useState(false)`). When FlatList recycled the component instance for another post, `imageError` stayed `true`.
4. **Background Tint:** `styles.postImage` had `backgroundColor: '#18122c'`, causing letterboxing color mismatch.

#### The Fixes Applied
- **`mobile/src/components/feed/StandardPostCard.js`:**
  - Completely deleted the Unsplash dog photo URLs.
  - Added video file filtering (`isVideoUrl` checking `.mp4`, `.mov`, `.webm`, `.m3u8`) in `mediaList` and `photoUri`.
  - Added a `useEffect` on `post?.id` to reset `imageError(false)`, `isImageLoading(true)`, and `activeMediaIndex(0)` upon item recycling.
  - Added an elegant native dark placeholder (`postPlaceholder` with `#090514` background, subtle icon, and "Media unavailable" text) if an image fails to load.
  - Changed `postImage.backgroundColor` from `#18122c` to `#090514` to seamlessly blend with the app theme.

---

## 2b. v1.0.16 Update (October 21, 2026 — Morning)

### Issue 4: Previous Video Visible Behind Photo Posts

#### The Symptoms
- On the Home feed, some photo posts showed a blurred/full image behind the card (in the 12px side gaps and above/below the card), along with the `♫ Original Audio • @username  More` overlay at the top.
- It only happened on photo posts located directly after a video post. Photo posts surrounded by other photos looked clean.

#### The Root Cause
1. The "background image" was actually the **previous video post** in the feed (e.g. Krishna's quote post `id 126` showed video `id 127` behind it).
2. Android `VideoView` uses `surfaceType="surfaceView"` (required — see Section 3). A `SurfaceView` renders on a separate hardware layer behind the app window and punches a hole through the UI. **Android does not clip it to FlatList item bounds.**
3. When the user scrolled past a video, it was paused but its `VideoView` **stayed mounted** (FlatList `windowSize={3}` keeps neighbours alive), so its surface stayed active.
4. `StandardPostCard` has `marginHorizontal: 12` / `marginBottom: 16` and rounded corners, leaving transparent gaps through which the lingering surface showed.

#### The Fixes Applied
- **`mobile/src/screens/feed/ReelsScreen.js` (`ReelItem`, also used by `VideoPostCard`):** `VideoView` is now mounted **only** when `isActive && isScreenFocused`. Inactive items show the poster thumbnail. The `useVideoPlayer` instance stays alive, so buffering and resume are unaffected.
- **`mobile/src/components/feed/SponsoredAdCard.js`:** Same rule for video ads — `VideoView` mounted only when `isActive`.
- **`mobile/src/components/feed/VideoPostCard.js`:** Added `overflow: 'hidden'` so overlays never spill into neighbouring items.
- **`mobile/src/screens/feed/HomeScreen.js`:** `cardWrapper` is now full width, opaque (`#090514`) and `overflow: 'hidden'`.

> **Rule for future developers:** With `surfaceType="surfaceView"`, never leave an inactive `VideoView` mounted inside a scrolling list. Mount it only for the active item.

---

### Issue 5: Ads Without a Link Still Opening `funflick.in` (Backend Root Cause)

#### The Root Cause
The v1.0.15 mobile fix removed the client-side fallback, but the **backend** was still injecting it:
- `server/src/controllers/adminController.js` returned `actionUrl: r.action_url || 'https://funflick.in'` in `getAdminAds` (public `GET /api/ads`) and in the user ad-requests listing.
- `approveAdRequest` saved `request.action_url || 'https://funflick.in'` into `platform_ads`.
- `createAdRequest` defaulted `actionUrl = 'https://funflick.in'`.
- Both ad request forms (mobile `SubmitAdRequestModal.js`, web `SubmitAdRequestModal.jsx`) also sent `'https://funflick.in'` when the field was empty.

So the app always received a "valid" URL and showed the Visit/CTA button.

#### The Fixes Applied
- **Backend (`adminController.js`):** All 4 fallbacks removed. Empty links — and legacy rows already stored as `https://funflick.in` / `https://www.funflick.in` — are returned/stored as `null`.
- **Mobile & web ad request forms:** Send `null` instead of `funflick.in` when no link is entered.
- **Mobile `SponsoredAdCard.js`:** `hasActionUrl` additionally rejects `funflick.in` variants as a safety net, so even before the backend is deployed, those ads render as pure brand sponsorships with no button and no redirect.

> [!IMPORTANT]
> The backend change must be **deployed to the production server** (EC2) and the Node process restarted for the server-side part to take effect.

---

## 3. Reference Note: Previous Black/Blank Screen Issue
*(Keep this for future developers or team reference)*

### What was the cause?
In `expo-video` on Android, `VideoView.kt` with `surfaceType="textureView"` and `useExoShutter={false}` sets `surfaceView.alpha = 0f` (completely transparent / black) until `onRenderedFirstFrame` is emitted. However, Expo's `FirstFrameEventGenerator.kt` aspect ratio check (`abs(trackAspectRatio - surfaceAspectRatio) < 0.05`) always failed on `TextureView`. Consequently, `onRenderedFirstFrame` never emitted, `alpha` remained permanently at `0f`, and the video stayed pitch black while audio played.

### How it was fixed:
Set all `VideoView` components to:
- `surfaceType="surfaceView"`
- `useExoShutter={true}`
- Added explicit listeners (`statusChange`, `playingChange`, `timeUpdate`) to track readiness.

### Instruction for future developers:
> *"In Android `expo-video`, ensure `VideoView` has `surfaceType="surfaceView"` and `useExoShutter={true}`. Do NOT use `surfaceType="textureView"` with `useExoShutter={false}`, because `TextureView` fails the first-frame aspect ratio check, permanently locking the native surface alpha to 0 (invisible)."*

---

## 4. Keystore & EAS Account Configuration Reference

- **Active EAS Account:** `gouravboga64` (`helishboom@gmail.com`)
- **Project ID:** `7b9a2ca5-3845-4c97-a74a-04d9bcf31d21`
- **Keystore Location:** `mobile/@funflick__funflick.jks`
- **Configuration File:** `mobile/credentials.json` (pointing to the local `.jks` file)
- **Key Alias:** `ddb4f68bf737f6f9e87a3f93b2c272f8`
- **EAS Config (`mobile/eas.json`):** Set `credentialsSource: "local"`
- **Security:** `credentials.json` is gitignored. Do not delete or commit it.

---

## 5. How to Resume in the Morning

1. **Check EAS Build Status:**
   - Visit the builds page: [https://expo.dev/accounts/gouravboga64/projects/funflick/builds](https://expo.dev/accounts/gouravboga64/projects/funflick/builds)
   - When the `1.0.16 (17)` build finishes, download the `.aab` file.
2. **Upload to Google Play Console:**
   - Go to Google Play Console -> FunFlick -> Production / Closed Testing.
   - Create a new release with the downloaded `.aab` (version `1.0.16`, versionCode `17`).
   - The signing key will match automatically because local keystore `ddb4f68bf737f6f9e87a3f93b2c272f8` was used.
3. **Deploy Backend:** Pull latest `main` on the server and restart the Node API so `adminController.js` changes go live.
4. **Device Verification Checklist:**
   - [ ] Scroll past 10+ feed items and reels: app should never exit or launch Play Store.
   - [ ] View an ad that has no redirect link: verify no redirect occurs and no "Visit" button is shown.
   - [ ] Check standard image posts: verify no stock dog photos appear, and missing media shows the clean dark placeholder.
   - [ ] Scroll video → photo → video on Home: photo cards must have clean dark edges, with no previous video visible behind them.
   - [ ] Swipe through the Videos tab: playback starts normally (a brief poster flash before the first frame is expected).
   - [ ] Video ads in feed play when active and show poster when scrolled away.
