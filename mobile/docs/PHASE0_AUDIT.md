# Phase 0 – Setup & Comprehensive Audit Report

## 1. SDK 57 Setup & Diagnostics
- **Packages Installed via `npx expo install`**:
  - `expo-dev-client@~57.0.19`
  - `expo-image@~57.0.5`
  - `react-native-reanimated@4.5.1`
  - `react-native-worklets@0.10.1`
- **Config Plugins Added**: `expo-image` automatically appended to `mobile/app.json`.
- **`npx expo-doctor` Result**: 18/18 checks passed. No issues detected.
- **Rebuild Notice**: Native modules (`expo-dev-client`, `react-native-reanimated`, `expo-image`) require dev client / standalone preview build.

---

## 2. Comprehensive Codebase Audit Findings (8 Items)

### 1. Every Call Site of `showMobileAd()` and `dismissMobileAd()`
- **`showMobileAd()` Definition**:
  - `mobile/src/context/AppContext.js` (lines 745–775)
- **Call Sites of `showMobileAd()`**:
  1. `AppContext.js:196`: `login()` handler inside `setTimeout(..., 1200)`. Caller: `'login'`.
  2. `AppContext.js:219`: `register()` handler inside `setTimeout(..., 1200)`. Caller: `'register'`.
  3. `AppContext.js:246`: `loginWithGoogle()` handler inside `setTimeout(..., 1200)`. Caller: `'loginWithGoogle'`.
  4. `AppContext.js:270`: `selectGoogleAccount()` handler inside `setTimeout(..., 1200)`. Caller: `'selectGoogleAccount'`.
  5. `AppContext.js:903`: `useEffect()` on session restore / launch / auth load inside `setTimeout(..., 2500)`. Caller: `'session_restore_effect'`.
  6. `HomeScreen.js:23`: Destructured in component header, but **never invoked** directly in `HomeScreen.js`.
- **Ad Selection Logic**:
  - If `adId` is passed: picks `adsList.find(a => a.id === adId)`.
  - If no `adId`: picks the first ad from `adsList` matching:
    - `a.active === true`
    - `a.frequency` is `'Pop-up Ads'`, `'On App Open'`, or `'Once per session'`
    - `!sessionSeenAdIdsRef.current.has(a.id)`
- **`dismissMobileAd()` Definition & Calls**:
  - `AppContext.js` (lines 776–797).
  - Called only by `handleClose()` in `MobileAdPopup.js` (line 130).
  - **Sequential Queue behavior**: When dismissed, `dismissMobileAd` immediately searches `adsList` for another unseen popup ad (`nextPopupAd`). If found, it displays the next popup ad back-to-back before setting `activePopupAd = null`.

### 2. `activePopupAd` Lifecycle & Video Player in `MobileAdPopup`
- **Modal Component**: Standard React Native `<Modal>` (`MobileAdPopup.js:134`).
- **Player Subcomponent**: `<AdVideoPlayer key={ad.id} mediaUrl={ad.mediaUrl} muted={muted} />` (`MobileAdPopup.js:193`).
- **Player Reuse**: Because `key={ad.id}` is set on `AdVideoPlayer`, the inner player is **unmounted and remounted** when `ad.id` changes.
- **Surface Type**: `surfaceType="textureView"` (`MobileAdPopup.js:47`).

### 3. Subscription & "Paid / Ad-Free" Computation
- **In `AppContext.js` (lines 697–711)**:
  - Computes `isPaidInfluencer` checking:
    - `currentUser?.isAdFreeSubscriber === true`
    - `currentUser?.subscription_plan` / `currentUser?.subscriptionPlan` NOT in `['Free Member', 'Free User', 'free', 'Free Creator']`
    - `currentUser?.subscription_expires_at` / `currentUser?.subscriptionExpiresAt` > `new Date()`
- **In `HomeScreen.js` (line 19)**: Directly consumes `isPaidInfluencer` from `useApp()`.
- **In `MobileAdPopup.js` (lines 57–72)**: Redundantly recomputes the exact same check on top of `ctxIsPaidInfluencer`.
- **Subscription Fields in User Payload**:
  - `isAdFreeSubscriber` (boolean)
  - `subscription_plan` / `subscriptionPlan` (string, e.g. `'Pro'`, `'VIP'`, `'Free Member'`)
  - `subscription_expires_at` / `subscriptionExpiresAt` (ISO date string)

### 4. Possible Values of `ad.frequency` & Placement
- **Backend Database / API**:
  - Defined in `server/src/config/db.js:504` and `server/src/controllers/adminController.js:847, 881`.
  - **Interstitials / Popups**: `'Pop-up Ads'`, `'On App Open'`, `'Once per session'`.
  - **Feed In-Stream**: `'After 5 Reels'`, `'Every 5 Reels'`. Default is `'After 5 Reels'`.

### 5. How `recordAdMetric` is Called & Double-Counting Audit
- **Popup Ads**:
  - Impression is recorded **immediately** inside `showMobileAd()` when the ad is selected (`AppContext.js:762`), before the modal even finishes animating.
- **In-Feed Ads (`SponsoredAdCard.js:64-69`)**:
  - Has a `hasRecordedImpression` ref, but it runs on initial mount regardless of whether the card is in the visible viewport (`isActive={false}` in `HomeScreen:103`).
  - If the FlatList scrolls far and recycles/remounts the item, a fresh ref is instantiated and another impression is recorded, leading to **double or multi-counting**.

### 6. Story / Owner Fields in API & Empty Response Handling
- **API Data Structure (`GET /api/stories`)**:
  - Outer group: `id: "st_user_<userId>"`, `userId: <number>`, `username: <string>`, `name`, `avatar`, `hasUnseen`, `stories: [...]`.
  - Inner items: `id: <number>`, `mediaUrl`, `mediaType`, `caption`, `music`, `likesCount`, `isLiked`, `isViewed`.
  - **Crucial Finding**: The inner story objects do NOT contain `user_id` or `userId`. Ownership exists exclusively on the parent `targetStory` group (`targetStory.userId`, `targetStory.username`).
- **`apiRequest` Handling of 204 / Empty Responses**:
  - `services/api.js:117-122`:
  - `const data = await response.json().catch(() => ({}));`
  - For HTTP 204 No Content or empty bodies, `response.json()` throws a SyntaxError, which is caught and safely returns `{}`.

### 7. BottomTabNavigator & Playback Lifecycle
- **Tab Bar Style**: In-flow bottom bar with `styles.tabBar` (`backgroundColor: '#0a0515', borderTopWidth: 1, elevation: 12`). Height is `60 + bottomInset`. Not absolute/floating overlay.
- **Tab Bar Configuration**: `lazy: true` (default), neither `freezeOnBlur` nor `unmountOnBlur` is specified.
- **Video Playback During Screen Switches**:
  - When navigating between bottom tabs (`Feed` -> `Discover` -> `Inbox`), `useIsFocused()` on `HomeScreen` turns `false`, and `VideoPostCard` pauses.
  - When a root stack screen (`StoryViewer`, `VideoDetail`) opens on top of `MainTabs`, `MainTabs` is blurred in native-stack, pausing `VideoPostCard`.
  - **Caveat**: When `MobileAdPopup` opens, it renders as an RN `<Modal>` over `App.js`. Because `<Modal>` does not blur the React Navigation route, `VideoPostCard`'s `isFocused` remains `true`.

### 8. Modals & Gesture-Handler Usage
- **`CommentsModal.js`**:
  - Uses standard React Native `<Modal visible={visible} transparent animationType="slide">`.
  - Contains no `react-native-gesture-handler` gestures; swipe-down dismiss is not currently implemented.
- **`MobileAdPopup.js`**:
  - Uses standard React Native `<Modal visible={...} transparent animationType="fade">`.
  - Uses only standard `TouchableOpacity` buttons without gesture handlers.

---

## 3. Added [DBG] Diagnostic Logs
1. `[DBG][AdEligibility]`: Logs `isPaidInfluencer`, user ID, plan, and expiration date on change.
2. `[DBG][showMobileAd]`: Logs caller identifier (`'login'`, `'register'`, `'session_restore_effect'`), target ad ID, and ad count.
3. `[DBG][StoryViewerScreen] isOwner inputs`: Logs user ID/username vs story group/item IDs and the computed boolean.
4. `[DBG][StoryViewerScreen] delete API result`: Logs the server response of `DELETE /stories/:id`.
5. `[DBG][VideoPostCard] play-pause decision`: Logs `postId`, `isActive`, `isFocused`, `isUserPaused`, and the final decision (`PLAY` or `PAUSE`).
6. `[DBG][ReelsScreen] play-pause decision`: Logs `reelId`, `isActive`, `isScreenFocused`, `isPaused`, and the final decision (`PLAY` or `PAUSE`).
