# FunFlick Mobile App - Project Handover & Status Report

**Date:** October 21, 2026 (Night Handover)  
**Current Version:** `1.0.15` (versionCode `16`)  
**Active Git Branch:** `main` (Latest Commit: `d591f56`)  
**EAS Build URL:** [https://expo.dev/accounts/gouravboga64/projects/funflick/builds/9d24d9fc-f52b-404f-af45-3670ca7611c6](https://expo.dev/accounts/gouravboga64/projects/funflick/builds/9d24d9fc-f52b-404f-af45-3670ca7611c6)

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
   - Visit the build page: [https://expo.dev/accounts/gouravboga64/projects/funflick/builds/9d24d9fc-f52b-404f-af45-3670ca7611c6](https://expo.dev/accounts/gouravboga64/projects/funflick/builds/9d24d9fc-f52b-404f-af45-3670ca7611c6)
   - When finished, download the `.aab` file.
2. **Upload to Google Play Console:**
   - Go to Google Play Console -> FunFlick -> Production / Closed Testing.
   - Create a new release with the downloaded `.aab` (version `1.0.15`, versionCode `16`).
   - The signing key will match automatically because local keystore `ddb4f68bf737f6f9e87a3f93b2c272f8` was used.
3. **Device Verification Checklist:**
   - [ ] Scroll past 10+ feed items and reels: app should never exit or launch Play Store.
   - [ ] View an ad that has no redirect link: verify no redirect occurs and no "Visit" button is shown.
   - [ ] Check standard image posts: verify no stock dog photos appear, and missing media shows the clean dark placeholder.
