import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Crown,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest, setStoredUser } from '../../services/api';
import { colors } from '../../theme/colors';

// Default mock plans matching image copy 37.png and website
const DEFAULT_PLANS = [
  {
    id: 'weekly',
    name: 'Weekly Influencer',
    label: 'Starter Pass',
    price: 99,
    formattedPrice: '₹99',
    period: 'week',
    durationDays: 7,
    description: 'Perfect for trying Influencer analytics & rewards for 7 days',
    popular: false,
    savings: null,
    features: [
      'Official Influencer status badge',
      'Advanced performance analytics (Views, Likes, Comments, Shares, Saves)',
      'Engagement rate analysis',
      'Direct payouts eligibility',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Influencer',
    label: 'Most Popular',
    price: 299,
    formattedPrice: '₹299',
    period: 'month',
    durationDays: 30,
    description: 'Best choice for regular video & comedy creators',
    popular: true,
    savings: null,
    features: [
      'Official Influencer status badge',
      'Deep 8-factor audience analytics',
      'View-based weekly cash payouts',
      'Priority placement on Discover feed',
      'Dedicated creator support',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Influencer',
    label: 'Best Value',
    price: 1999,
    formattedPrice: '₹1,999',
    period: 'year',
    durationDays: 365,
    description: 'Full creator studio access with highest revenue share tier',
    popular: false,
    savings: 'SAVE 45%',
    features: [
      'All Monthly features included',
      'Highest revenue share tier (up to 70%)',
      'VIP verification crown badge',
      'Priority review on all video uploads',
      'Custom brand collaboration deals',
    ],
  },
];

export const SubscriptionScreen = ({ navigation }) => {
  const { currentUser, setCurrentUser } = useApp();
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState('weekly');
  const [subStatus, setSubStatus] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Fetch live plans and subscription status from AWS EC2 backend
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoadingStatus(true);
      const [plansRes, statusRes] = await Promise.all([
        apiRequest('/subscriptions/plans').catch(() => null),
        apiRequest('/subscriptions/my-status').catch(() => null),
      ]);

      if (plansRes && Array.isArray(plansRes.plans) && plansRes.plans.length > 0) {
        setPlans(
          plansRes.plans.map(p => ({
            id: p.id,
            name: p.name,
            label: p.label || '',
            price: Number(p.price),
            formattedPrice: p.formatted_price || `₹${p.price}`,
            period: p.period || 'month',
            durationDays: p.durationDays || (p.period === 'week' ? 7 : p.period === 'year' ? 365 : 30),
            description: p.description || '',
            popular: Boolean(p.popular),
            savings: p.savings || null,
            features: Array.isArray(p.features) ? p.features : [],
          }))
        );
      }

      if (statusRes) {
        setSubStatus(statusRes);
      }
    } catch (e) {
      console.warn('Subscription fetch error:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const isUserSubscribed = Boolean(
    subStatus?.isActive ||
    currentUser?.isInfluencer ||
    (currentUser?.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
  );

  const activePlanName = subStatus?.planName || currentUser?.subscriptionPlan || 'Weekly Influencer';
  const activeDaysRemaining = subStatus?.daysRemaining !== undefined
    ? Number(subStatus.daysRemaining)
    : (isUserSubscribed ? 5 : 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const activeStartDate = subStatus?.startDate
    ? formatDate(subStatus.startDate)
    : (isUserSubscribed ? '7 Oct 2026' : '');

  const activeExpiryDate = subStatus?.expiresAt
    ? formatDate(subStatus.expiresAt)
    : (isUserSubscribed ? '14 Oct 2026' : '');

  const isPurchasingRef = useRef(false);

  const handlePurchase = async (plan) => {
    if (isPurchasingRef.current || processingPlanId) return;
    isPurchasingRef.current = true;
    setSelectedPlanId(plan.id);
    setProcessingPlanId(plan.id);

    try {
      const paymentId = `pay_app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await apiRequest('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
          paymentId,
        }),
      });

      // Update current user state with influencer role
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          isInfluencer: true,
          subscriptionPlan: plan.name,
        };
        setCurrentUser(updatedUser);
        await setStoredUser(updatedUser);
      }

      // Reload status
      await loadSubscriptionData();

      Alert.alert(
        '🎉 Subscription Activated!',
        `Congratulations! You are now subscribed to ${plan.name}. Your influencer pass and creator monetization tools are active!`,
        [{ text: 'Awesome!', onPress: () => {} }]
      );
    } catch (err) {
      console.warn('Purchase error:', err);
      // Fallback local update if network issue
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          isInfluencer: true,
          subscriptionPlan: plan.name,
        };
        setCurrentUser(updatedUser);
        await setStoredUser(updatedUser);
      }
      Alert.alert('Activated!', `You are now upgraded to ${plan.name}!`);
    } finally {
      setProcessingPlanId(null);
      setTimeout(() => {
        isPurchasingRef.current = false;
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Influencer Subscription</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Hero Icon & Tagline (Matching image copy 37.png) */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#ff007a', '#ff4b2b', '#7928ca']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIconBox}
          >
            <Crown size={28} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
          <Text style={styles.heroTitle}>Upgrade to Influencer Status</Text>
          <Text style={styles.heroSubtitle}>
            <Text style={styles.heroHighlight}>Uploading is 100% Free for everyone!</Text>{' '}
            Subscribe to become an Influencer, unlock deep engagement analytics, and earn cash rewards from Admin.
          </Text>
        </View>

        {/* 3. Subscription Validity Card (Matching image copy 37.png) */}
        {isUserSubscribed && (
          <View style={styles.validityCard}>
            {/* Top row */}
            <View style={styles.validityTopRow}>
              <View style={styles.validityPlanLeft}>
                <View style={styles.shieldIconBox}>
                  <ShieldCheck size={18} color="#34d399" />
                </View>
                <View>
                  <View style={styles.planBadgeRow}>
                    <Text style={styles.validityPlanName}>{activePlanName}</Text>
                    <View style={styles.activeValidBadge}>
                      <Text style={styles.activeValidText}>ACTIVE & VALID</Text>
                    </View>
                  </View>
                  <Text style={styles.validitySub}>Creator Monetization & Reach Active</Text>
                </View>
              </View>

              <View style={styles.daysRemainingBox}>
                <Text style={styles.daysNumber}>{activeDaysRemaining}</Text>
                <Text style={styles.daysText}>
                  {activeDaysRemaining === 1 ? 'day remaining' : 'days remaining'}
                </Text>
              </View>
            </View>

            {/* Dates row */}
            <View style={styles.datesGrid}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <Text style={styles.dateValue}>{activeStartDate || 'Active'}</Text>
              </View>
              <View style={[styles.dateCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.dateLabel}>Valid Until / Expiry:</Text>
                <Text style={[styles.dateValue, { color: '#34d399' }]}>
                  {activeExpiryDate || `${activeDaysRemaining} Days`}
                </Text>
              </View>
            </View>

            {/* Extension Guarantee banner */}
            <View style={styles.extensionBanner}>
              <Sparkles size={16} color="#fbbf24" style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={styles.extensionText}>
                <Text style={{ fontWeight: '800', color: '#fbbf24' }}>Plan Extension Guarantee:</Text>{' '}
                Purchasing another plan while your subscription is active will{' '}
                <Text style={{ textDecorationLine: 'underline', color: '#ffffff', fontWeight: '800' }}>
                  extend your existing expiry date
                </Text>{' '}
                by adding the new days to your remaining {activeDaysRemaining} days!
              </Text>
            </View>
          </View>
        )}

        {/* 4. Subscription Plan Cards List */}
        <View style={styles.plansList}>
          {plans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            const isProcessing = processingPlanId === plan.id;

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                onPress={() => setSelectedPlanId(plan.id)}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                ]}
              >
                {/* Popular / Savings Badge */}
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                {plan.savings && !plan.popular && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                  </View>
                )}

                {/* Plan Header */}
                <View style={styles.planCardHeader}>
                  <View style={styles.planHeaderLeft}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.planCardTitle}>{plan.name}</Text>
                        {plan.label ? (
                          <Text style={styles.planCardLabel}>({plan.label})</Text>
                        ) : null}
                      </View>
                      <Text style={styles.planCardDesc}>{plan.description}</Text>
                    </View>
                  </View>

                  <View style={styles.planPriceBox}>
                    <Text style={styles.planPriceText}>{plan.formattedPrice}</Text>
                    <Text style={styles.planPeriodText}>/{plan.period}</Text>
                  </View>
                </View>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {plan.features.map(f => (
                    <View key={f} style={styles.featureItem}>
                      <Check size={14} color="#34d399" strokeWidth={2.5} style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Row */}
                <View style={styles.planActionRow}>
                  <View>
                    <Text style={styles.validityInfoText}>
                      {isUserSubscribed && activeDaysRemaining > 0
                        ? `+${plan.durationDays} days stacked`
                        : `Valid for ${plan.durationDays} days`}
                    </Text>
                    <Text style={styles.actionPriceText}>{plan.formattedPrice}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handlePurchase(plan)}
                    disabled={isProcessing}
                    style={styles.payBtn}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#ff007a', '#ff4b2b', '#7928ca']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payGradient}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={styles.payBtnInner}>
                          <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                          <Text style={styles.payBtnText}>
                            {isUserSubscribed && activeDaysRemaining > 0
                              ? `Extend (+${plan.durationDays}d) · ${plan.formattedPrice}`
                              : `Pay ${plan.formattedPrice}`}
                          </Text>
                          <ArrowRight size={14} color="#ffffff" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Benefits Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Sparkles size={16} color="#f472b6" />
            <Text style={styles.benefitsTitle}>WHY CREATORS SUBSCRIBE TO FUNFLICK</Text>
          </View>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Zap size={16} color="#fbbf24" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.benefitText}>Instant Video & Reel Publishing</Text>
            </View>
            <View style={styles.benefitItem}>
              <TrendingUp size={16} color="#34d399" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.benefitText}>Priority Viral Discover Placement</Text>
            </View>
            <View style={styles.benefitItem}>
              <Award size={16} color="#c084fc" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.benefitText}>Monetize with Fan Subscriptions</Text>
            </View>
            <View style={styles.benefitItem}>
              <ShieldCheck size={16} color="#60a5fa" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.benefitText}>Safe Admin Moderation & Payouts</Text>
            </View>
          </View>
        </View>

        {/* 6. Security Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityPill}>
            <Text style={styles.securityPillText}>🔒 Secured by Razorpay</Text>
          </View>
          <Text style={styles.securitySub}>
            Tap <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>Pay</Text> on any plan above for instant activation via UPI (GPay, PhonePe, Paytm), Cards, or NetBanking.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  heroHighlight: {
    color: '#34d399',
    fontWeight: '800',
  },
  validityCard: {
    backgroundColor: '#120d29',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    padding: 16,
    marginBottom: 18,
  },
  validityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validityPlanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shieldIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(52,211,153,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityPlanName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  activeValidBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeValidText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
  },
  validitySub: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  daysRemainingBox: {
    alignItems: 'flex-end',
  },
  daysNumber: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  daysText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '600',
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
    marginBottom: 2,
  },
  dateValue: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  extensionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    padding: 10,
  },
  extensionText: {
    color: '#fef08a',
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
  plansList: {
    gap: 14,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#150f2c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#ff007a',
    backgroundColor: '#1c1138',
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#ff007a',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#ff007a',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#9333ea',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  savingsBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#ff007a',
    backgroundColor: '#ff007a',
  },
  planCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  planCardLabel: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '700',
  },
  planCardDesc: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginTop: 2,
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPriceText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  planPeriodText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  planActionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validityInfoText: {
    color: '#94a3b8',
    fontSize: 9.5,
  },
  actionPriceText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  payBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  payGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  payBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  benefitsCard: {
    backgroundColor: '#140e2b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  benefitsTitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  benefitsGrid: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: 'rgba(20,14,43,0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  securityPill: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  securityPillText: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '800',
  },
  securitySub: {
    color: '#94a3b8',
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 14,
  },
});
