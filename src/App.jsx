import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { FloatingNavButton } from './components/common/FloatingNavButton';
import { PhoneFrame } from './components/common/PhoneFrame';
import { ToastContainer } from './components/common/Toast';

// Auth Pages
import { SplashScreen } from './pages/auth/SplashScreen';
import { LoginScreen } from './pages/auth/LoginScreen';
import { SignUpScreen } from './pages/auth/SignUpScreen';
import { VerifyOtpScreen } from './pages/auth/VerifyOtpScreen';
import { ForgotPasswordScreen } from './pages/auth/ForgotPasswordScreen';

// User Pages
import { HomeScreen } from './pages/user/HomeScreen';
import { ReelsScreen } from './pages/user/ReelsScreen';
import { DiscoverScreen } from './pages/user/DiscoverScreen';
import { VideoDetailScreen } from './pages/user/VideoDetailScreen';
import { CreatorProfileScreen } from './pages/user/CreatorProfileScreen';
import { UserProfileScreen } from './pages/user/UserProfileScreen';
import { SubscriptionScreen } from './pages/user/SubscriptionScreen';
import { WalletScreen } from './pages/user/WalletScreen';
import { NotificationsScreen } from './pages/user/NotificationsScreen';
import { MessagesScreen } from './pages/user/MessagesScreen';
import { MyContentScreen } from './pages/user/MyContentScreen';

// Create Pages
import { CreatePostScreen } from './pages/user/create/CreatePostScreen';
import { UploadVideoScreen } from './pages/user/create/UploadVideoScreen';
import { CreateStoryScreen } from './pages/user/create/CreateStoryScreen';

// Creator Studio Pages
import { CreatorDashboardScreen } from './pages/creator-studio/CreatorDashboardScreen';
import { CreatorVideosScreen } from './pages/creator-studio/CreatorVideosScreen';
import { CreatorAnalyticsScreen } from './pages/creator-studio/CreatorAnalyticsScreen';
import { CreatorEarningsScreen } from './pages/creator-studio/CreatorEarningsScreen';

// Admin Pages
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminUsersScreen } from './pages/admin/AdminUsersScreen';
import { AdminCreatorsScreen } from './pages/admin/AdminCreatorsScreen';
import { AdminContentScreen } from './pages/admin/AdminContentScreen';
import { AdminSubscriptionsScreen } from './pages/admin/AdminSubscriptionsScreen';
import { AdminPayoutsScreen } from './pages/admin/AdminPayoutsScreen';
import { AdminRevenueScreen } from './pages/admin/AdminRevenueScreen';
import { AdminReportsScreen } from './pages/admin/AdminReportsScreen';
import { AdminCategoriesScreen } from './pages/admin/AdminCategoriesScreen';
import { AdminSettingsScreen } from './pages/admin/AdminSettingsScreen';
import { AdminInfluencerMediaScreen } from './pages/admin/AdminInfluencerMediaScreen';
import { AdminAdsScreen } from './pages/admin/AdminAdsScreen';

// Wrapper for mobile-first user routes
const MobileAppWrapper = ({ children }) => {
  return <PhoneFrame>{children}</PhoneFrame>;
};

function AppRoutes() {
  const location = useLocation();
  const { theme, isAuthenticated } = useApp();
  const isAdmin = location.pathname.startsWith('/admin');
  const isCreatorStudio = location.pathname.startsWith('/creator') && location.pathname !== '/creator/pavani_official' && !location.pathname.startsWith('/creator/c');

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-100 text-slate-900 light' : 'bg-[#07040d] text-white dark'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Discreet Floating Prototype Navigation Button */}
      <FloatingNavButton />

      {/* Global Toast Container */}
      <ToastContainer />

      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Initial Entry Route: Visitors get the Get Started Splash Page First */}
          <Route 
            path="/" 
            element={
              <MobileAppWrapper>
                {!isAuthenticated ? <SplashScreen /> : <HomeScreen />}
              </MobileAppWrapper>
            } 
          />
          <Route path="/splash" element={<MobileAppWrapper><SplashScreen /></MobileAppWrapper>} />
          <Route path="/login" element={<MobileAppWrapper><LoginScreen /></MobileAppWrapper>} />
          <Route path="/signup" element={<MobileAppWrapper><SignUpScreen /></MobileAppWrapper>} />
          <Route path="/verify" element={<MobileAppWrapper><VerifyOtpScreen /></MobileAppWrapper>} />
          <Route path="/forgot-password" element={<MobileAppWrapper><ForgotPasswordScreen /></MobileAppWrapper>} />

          {/* User Mobile App Routes */}
          <Route path="/feed" element={<MobileAppWrapper><HomeScreen /></MobileAppWrapper>} />
          <Route path="/reels" element={<MobileAppWrapper><ReelsScreen /></MobileAppWrapper>} />
          <Route path="/discover" element={<MobileAppWrapper><DiscoverScreen /></MobileAppWrapper>} />
          <Route path="/video/:id" element={<MobileAppWrapper><VideoDetailScreen /></MobileAppWrapper>} />
          <Route path="/creator/:username" element={<MobileAppWrapper><CreatorProfileScreen /></MobileAppWrapper>} />
          <Route path="/profile" element={<MobileAppWrapper><UserProfileScreen /></MobileAppWrapper>} />
          <Route path="/subscription" element={<MobileAppWrapper><SubscriptionScreen /></MobileAppWrapper>} />
          <Route path="/wallet" element={<MobileAppWrapper><WalletScreen /></MobileAppWrapper>} />
          <Route path="/notifications" element={<MobileAppWrapper><NotificationsScreen /></MobileAppWrapper>} />
          <Route path="/messages" element={<MobileAppWrapper><MessagesScreen /></MobileAppWrapper>} />
          <Route path="/my-content" element={<MobileAppWrapper><MyContentScreen /></MobileAppWrapper>} />

          {/* Create Routes */}
          <Route path="/create" element={<MobileAppWrapper><CreatePostScreen /></MobileAppWrapper>} />
          <Route path="/create/post" element={<MobileAppWrapper><CreatePostScreen /></MobileAppWrapper>} />
          <Route path="/create/video" element={<MobileAppWrapper><UploadVideoScreen /></MobileAppWrapper>} />
          <Route path="/create/story" element={<MobileAppWrapper><CreateStoryScreen /></MobileAppWrapper>} />

          {/* Creator Studio Routes */}
          <Route path="/creator/dashboard" element={<MobileAppWrapper><CreatorDashboardScreen /></MobileAppWrapper>} />
          <Route path="/creator/videos" element={<MobileAppWrapper><CreatorVideosScreen /></MobileAppWrapper>} />
          <Route path="/creator/analytics" element={<MobileAppWrapper><CreatorAnalyticsScreen /></MobileAppWrapper>} />
          <Route path="/creator/earnings" element={<MobileAppWrapper><CreatorEarningsScreen /></MobileAppWrapper>} />

          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminDashboardScreen />} />
          <Route path="/admin/influencer-media" element={<AdminInfluencerMediaScreen />} />
          <Route path="/admin/ads" element={<AdminAdsScreen />} />
          <Route path="/admin/users" element={<AdminUsersScreen />} />
          <Route path="/admin/creators" element={<AdminCreatorsScreen />} />
          <Route path="/admin/content" element={<AdminContentScreen />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptionsScreen />} />
          <Route path="/admin/manage-subscriptions" element={<AdminSubscriptionsScreen />} />
          <Route path="/admin/payouts" element={<AdminPayoutsScreen />} />
          <Route path="/admin/revenue" element={<AdminRevenueScreen />} />
          <Route path="/admin/reports" element={<AdminReportsScreen />} />
          <Route path="/admin/categories" element={<AdminCategoriesScreen />} />
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
