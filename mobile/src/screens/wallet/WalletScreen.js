import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Wallet,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BarChart3,
  Search,
  X,
  Receipt,
  Copy,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const WalletScreen = ({ navigation }) => {
  const { currentUser, setCurrentUser } = useApp();

  // Data states
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [registeredDetails, setRegisteredDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState(currentUser?.walletBalance ?? 0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Payout form state
  const [payoutMethod, setPayoutMethod] = useState('bank'); // 'bank' | 'upi'
  const [payoutBankName, setPayoutBankName] = useState('');
  const [payoutAccountNum, setPayoutAccountNum] = useState('');
  const [payoutConfirmAccountNum, setPayoutConfirmAccountNum] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Filter states
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL' | 'TODAY' | '7D' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'
  const [methodFilter, setMethodFilter] = useState('ALL'); // 'ALL' | 'UPI' | 'BANK'
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [histRes, detRes] = await Promise.all([
        apiRequest('/payouts/my-history').catch(() => null),
        apiRequest('/payouts/details').catch(() => null),
      ]);

      if (histRes) {
        setPayoutHistory(histRes.payouts || []);
        if (histRes.walletBalance !== undefined) {
          setWalletBalance(histRes.walletBalance);
          if (setCurrentUser) {
            setCurrentUser(prev => prev ? ({ ...prev, walletBalance: histRes.walletBalance }) : prev);
          }
        }
      }

      if (detRes && detRes.payoutDetails) {
        const d = detRes.payoutDetails;
        setRegisteredDetails(d);
        setPayoutMethod(d.payout_method || 'bank');
        setPayoutBankName(d.bank_name || '');
        setPayoutAccountNum(d.account_number || '');
        setPayoutConfirmAccountNum(d.account_number || '');
        setPayoutIfsc(d.ifsc_code || '');
        setPayoutUpiId(d.upi_id || '');
      }
    } catch (err) {
      console.warn('Failed to load wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latestPaid = useMemo(
    () => payoutHistory.find(p => p.status === 'Paid'),
    [payoutHistory]
  );

  // Date filtering logic
  const filteredPayouts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    return payoutHistory.filter(p => {
      const pDate = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());

      if (timeFilter === 'TODAY' && pDate < startOfToday) return false;
      if (timeFilter === '7D' && pDate < sevenDaysAgo) return false;
      if (timeFilter === 'THIS_MONTH' && pDate < startOfThisMonth) return false;
      if (timeFilter === 'LAST_MONTH' && (pDate < startOfLastMonth || pDate > endOfLastMonth)) return false;
      if (timeFilter === 'THIS_YEAR' && pDate < startOfThisYear) return false;

      if (methodFilter === 'UPI') {
        const m = (p.payment_method || p.method || '').toLowerCase();
        if (!m.includes('upi')) return false;
      }
      if (methodFilter === 'BANK') {
        const m = (p.payment_method || p.method || '').toLowerCase();
        if (!m.includes('bank')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ref = (p.payment_reference || p.reference || p.admin_reference || '').toLowerCase();
        const title = (p.videoTitle || p.video_title || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        if (!ref.includes(q) && !title.includes(q) && !notes.includes(q)) return false;
      }

      return true;
    });
  }, [payoutHistory, timeFilter, methodFilter, searchQuery]);

  // Aggregate stats
  const periodStats = useMemo(() => {
    const paidList = filteredPayouts.filter(p => p.status === 'Paid');
    const totalAmount = paidList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalSettledViews = paidList.reduce((acc, curr) => acc + Number(curr.settledViews || 0), 0);
    const avgAmount = paidList.length > 0 ? Math.round(totalAmount / paidList.length) : 0;
    return {
      totalAmount,
      count: paidList.length,
      totalSettledViews,
      avgAmount,
    };
  }, [filteredPayouts]);

  // Month-wise grouping for accordion ledger
  const monthGroups = useMemo(() => {
    const groups = {};
    filteredPayouts.forEach(p => {
      const d = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
      const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) {
        groups[key] = {
          monthKey: key,
          dateObj: d,
          payouts: [],
          totalAmount: 0,
        };
      }
      groups[key].payouts.push(p);
      if (p.status === 'Paid') {
        groups[key].totalAmount += Number(p.amount || 0);
      }
    });

    return Object.values(groups).sort((a, b) => b.dateObj - a.dateObj);
  }, [filteredPayouts]);

  // Bar chart data (Last 6 months or 7 days)
  const barChartData = useMemo(() => {
    if (timeFilter === '7D') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = d.toISOString().slice(0, 10);
        const sum = payoutHistory
          .filter(p => p.status === 'Paid')
          .filter(p => {
            const pd = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
            return pd.toISOString().slice(0, 10) === dateStr;
          })
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        days.push({ label: dayLabel, amount: sum });
      }
      return days;
    } else {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short' });
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const sum = payoutHistory
          .filter(p => p.status === 'Paid')
          .filter(p => {
            const pd = new Date(p.payment_date || p.paidAt || p.created_at || Date.now());
            const pYM = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
            return pYM === yearMonth;
          })
          .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        months.push({ label, amount: sum });
      }
      return months;
    }
  }, [payoutHistory, timeFilter]);

  const maxChartAmount = useMemo(() => {
    const max = Math.max(...barChartData.map(b => b.amount), 50);
    return max > 0 ? max : 50;
  }, [barChartData]);

  const toggleMonth = key => {
    setCollapsedMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyRef = async (text, id) => {
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      Alert.alert('Copied', `UTR Reference: ${text}`);
    } catch (e) {
      Alert.alert('UTR', text);
    }
  };

  const handleSavePayoutDetails = async () => {
    if (payoutMethod === 'bank') {
      if (!payoutBankName.trim()) {
        Alert.alert('Required', 'Please enter your bank name.');
        return;
      }
      if (!payoutAccountNum.trim() || payoutAccountNum.length < 8) {
        Alert.alert('Required', 'Please enter a valid bank account number (min 8 digits).');
        return;
      }
      if (payoutAccountNum !== payoutConfirmAccountNum) {
        Alert.alert('Mismatch', 'Bank account numbers do not match.');
        return;
      }
      if (!payoutIfsc.trim() || payoutIfsc.trim().length !== 11) {
        Alert.alert('Required', 'Please enter an 11-character valid IFSC code.');
        return;
      }
    } else {
      if (!payoutUpiId.trim() || !payoutUpiId.includes('@')) {
        Alert.alert('Required', 'Please enter a valid UPI ID (e.g. mobile@upi).');
        return;
      }
    }

    setIsSavingPayout(true);
    try {
      const res = await apiRequest('/payouts/details', {
        method: 'POST',
        body: JSON.stringify({
          payout_method: payoutMethod,
          bank_name: payoutBankName.trim(),
          account_number: payoutAccountNum.trim(),
          ifsc_code: payoutIfsc.trim().toUpperCase(),
          upi_id: payoutUpiId.trim(),
          phone: currentUser?.phone || '',
          email: currentUser?.email || '',
        }),
      });

      if (res && res.payoutDetails) {
        setRegisteredDetails(res.payoutDetails);
      }
      setIsPayoutModalOpen(false);
      Alert.alert('Saved', 'Your payout destination details have been updated!');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save payout details.');
    } finally {
      setIsSavingPayout(false);
    }
  };

  const totalPaidSum = payoutHistory
    .filter(p => p.status === 'Paid')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Profile' });
            }
          }}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Wallet size={18} color="#ff007a" />
          <Text style={styles.headerTitle}>Wallet & Payouts</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsPayoutModalOpen(true)}
          style={styles.headerRightBtn}
        >
          <Building2 size={16} color="#f472b6" />
          <Text style={styles.headerRightText}>Bank/UPI</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Latest Paid Notification Banner */}
        {latestPaid && (
          <View style={styles.latestPaidCard}>
            <CheckCircle2 size={20} color="#34d399" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <View style={styles.latestPaidTopRow}>
                <Text style={styles.latestPaidTitle}>Payout Disbursed by Admin</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              </View>
              <Text style={styles.latestPaidDesc}>
                ₹{Number(latestPaid.amount).toLocaleString('en-IN')} has been disbursed to your registered payout account.
              </Text>
              <View style={styles.latestPaidMetaRow}>
                <Text style={styles.latestPaidMeta}>
                  Method: <Text style={{ color: '#fff', fontWeight: '700' }}>{latestPaid.payment_method || 'Bank Transfer'}</Text>
                </Text>
                <Text style={styles.latestPaidMeta}>•</Text>
                <Text style={styles.latestPaidMeta}>
                  Ref: <Text style={{ color: '#34d399', fontWeight: '700' }}>{latestPaid.payment_reference || 'ADMIN_DISBURSED'}</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Top Balance Card */}
        <LinearGradient
          colors={['#ff007a', '#ff4b2b', '#7928ca']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#fef08a" />
              <Text style={styles.balanceCardSubtitle}>Creator Earnings & Wallet</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>INR (₹)</Text>
            </View>
          </View>

          <Text style={styles.balanceBigText}>
            ₹{Number(walletBalance).toLocaleString('en-IN')}
          </Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceSubRow}>
            <View>
              <Text style={styles.subLabel}>Total Payouts Received</Text>
              <Text style={styles.subVal}>₹{totalPaidSum.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.subLabel}>Registered Mode</Text>
              <Text style={[styles.subVal, { color: '#fef08a', textTransform: 'uppercase' }]}>
                {registeredDetails?.payout_method || 'Bank / UPI'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateDetailsCTA}
            activeOpacity={0.85}
            onPress={() => setIsPayoutModalOpen(true)}
          >
            <Building2 size={16} color="#db2777" />
            <Text style={styles.updateDetailsCTAText}>
              {registeredDetails ? 'Update Bank / UPI Payout Details' : 'Add Bank / UPI Payout Details'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* 4. Registered Destination Card */}
        <View style={styles.registeredCard}>
          <View style={styles.registeredCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#10b981" />
              <Text style={styles.registeredCardTitle}>Registered Payout Destination</Text>
            </View>
            <TouchableOpacity onPress={() => setIsPayoutModalOpen(true)}>
              <Text style={styles.registeredEditBtn}>Edit</Text>
            </TouchableOpacity>
          </View>

          {registeredDetails ? (
            <View style={styles.registeredDetailsBox}>
              {registeredDetails.payout_method === 'bank' ? (
                <>
                  <Text style={styles.regText}>Bank: <Text style={styles.regVal}>{registeredDetails.bank_name}</Text></Text>
                  <Text style={styles.regText}>Account: <Text style={styles.regVal}>{registeredDetails.account_number}</Text></Text>
                  <Text style={styles.regText}>IFSC: <Text style={styles.regVal}>{registeredDetails.ifsc_code}</Text></Text>
                </>
              ) : (
                <Text style={styles.regText}>UPI ID: <Text style={styles.regVal}>{registeredDetails.upi_id}</Text></Text>
              )}
              <Text style={styles.regPhoneNote}>
                Alert Phone: {registeredDetails.phone || currentUser?.phone || 'On file'}
              </Text>
            </View>
          ) : (
            <Text style={styles.noRegText}>
              No custom payout details registered yet. Tap "Add Bank / UPI Payout Details" above to set where you'd like your rewards deposited.
            </Text>
          )}
        </View>

        {/* 5. Time Filter Pills */}
        <View style={styles.sectionHeadRow}>
          <Calendar size={14} color="#f472b6" />
          <Text style={styles.sectionHeadTitle}>Time-Wise Earnings Analysis</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: '7D', label: 'Last 7 Days' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'LAST_MONTH', label: 'Last Month' },
            { id: 'THIS_YEAR', label: 'This Year' },
          ].map(tab => {
            const isActive = timeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setTimeFilter(tab.id)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Filtered Income</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              ₹{periodStats.totalAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Completed earnings</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Disbursals</Text>
            <Text style={[styles.kpiValue, { color: '#ffffff' }]}>{periodStats.count}</Text>
            <Text style={styles.kpiSub}>Transfers completed</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Views Settled</Text>
            <Text style={[styles.kpiValue, { color: '#22d3ee' }]}>
              {periodStats.totalSettledViews.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Milestone views</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avg. Payout</Text>
            <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>
              ₹{periodStats.avgAmount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Reward average</Text>
          </View>
        </View>

        {/* 7. Trend Micro-Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} color="#f472b6" />
              <Text style={styles.chartTitle}>
                {timeFilter === '7D' ? 'Last 7 Days Earnings Pulse' : 'Monthly Earnings Pulse'}
              </Text>
            </View>
            <Text style={styles.chartPeakText}>Peak: ₹{maxChartAmount.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.chartBarsContainer}>
            {barChartData.map((bar, idx) => {
              const heightPercent = Math.max((bar.amount / maxChartAmount) * 100, 8);
              const hasEarnings = bar.amount > 0;
              return (
                <View key={idx} style={styles.chartBarCol}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBarFill,
                        { height: `${heightPercent}%` },
                        hasEarnings ? styles.chartBarFillActive : styles.chartBarFillMuted,
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, hasEarnings && styles.chartBarLabelActive]}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 8. Search & Method Filters */}
        <View style={styles.toolbarWrap}>
          <View style={styles.searchBar}>
            <Search size={14} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by UTR, title..."
              placeholderTextColor="#64748b"
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.methodTabsRow}>
            {['ALL', 'UPI', 'BANK'].map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethodFilter(m)}
                style={[styles.methodTab, methodFilter === m && styles.methodTabActive]}
              >
                <Text style={[styles.methodTabText, methodFilter === m && styles.methodTabTextActive]}>
                  {m === 'ALL' ? 'All' : m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 9. Payout Ledger Accordion */}
        <View style={styles.ledgerHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Receipt size={16} color="#f472b6" />
            <Text style={styles.ledgerTitle}>Payout Disbursals Ledger</Text>
          </View>
          <Text style={styles.ledgerCountText}>
            {filteredPayouts.length} record{filteredPayouts.length === 1 ? '' : 's'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading ledger...</Text>
          </View>
        ) : filteredPayouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Building2 size={32} color="#475569" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No payouts found</Text>
            <Text style={styles.emptySub}>
              {timeFilter !== 'ALL' || searchQuery || methodFilter !== 'ALL'
                ? 'Try resetting your search or time filters.'
                : 'When admins process your views & likes performance reward, it will appear here.'}
            </Text>
          </View>
        ) : (
          monthGroups.map(group => {
            const isCollapsed = Boolean(collapsedMonths[group.monthKey]);
            return (
              <View key={group.monthKey} style={styles.monthGroupCard}>
                <TouchableOpacity
                  style={styles.monthHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleMonth(group.monthKey)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} color="#f472b6" />
                    <Text style={styles.monthName}>{group.monthKey}</Text>
                    <View style={styles.monthCountPill}>
                      <Text style={styles.monthCountText}>{group.payouts.length}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.monthSum}>₹{group.totalAmount.toLocaleString('en-IN')}</Text>
                    {isCollapsed ? (
                      <ChevronDown size={16} color="#94a3b8" />
                    ) : (
                      <ChevronUp size={16} color="#94a3b8" />
                    )}
                  </View>
                </TouchableOpacity>

                {!isCollapsed && (
                  <View style={styles.payoutList}>
                    {group.payouts.map(p => {
                      const isUPI = (p.payment_method || p.method || '').toLowerCase().includes('upi');
                      const refId = p.payment_reference || p.reference || p.admin_reference || 'ADMIN_DISBURSED';
                      const isCopied = copiedId === p.id;

                      return (
                        <View key={p.id} style={styles.payoutRow}>
                          <View style={styles.payoutLeft}>
                            <View style={[styles.payoutIconBox, isUPI ? styles.upiBox : styles.bankBox]}>
                              {isUPI ? (
                                <Smartphone size={18} color="#c084fc" />
                              ) : (
                                <Building2 size={18} color="#34d399" />
                              )}
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.payoutTitle} numberOfLines={1}>
                                {p.videoTitle ? `🎬 ${p.videoTitle}` : 'Creator Milestone Disbursal'}
                              </Text>

                              {p.settledViews > 0 && (
                                <View style={styles.viewsBadgeRow}>
                                  <Eye size={11} color="#22d3ee" />
                                  <Text style={styles.viewsBadgeText}>
                                    Milestone: {Number(p.settledViews).toLocaleString('en-IN')} views
                                  </Text>
                                </View>
                              )}

                              <TouchableOpacity
                                style={styles.utrRow}
                                onPress={() => handleCopyRef(refId, p.id)}
                              >
                                <Text style={styles.utrLabel}>UTR: </Text>
                                <Text style={styles.utrVal} numberOfLines={1}>{refId}</Text>
                                {isCopied ? (
                                  <Check size={12} color="#10b981" />
                                ) : (
                                  <Copy size={12} color="#94a3b8" />
                                )}
                              </TouchableOpacity>

                              <Text style={styles.payoutDate}>
                                {new Date(p.payment_date || p.paidAt || p.created_at || Date.now()).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.payoutRight}>
                            <Text style={styles.payoutAmount}>
                              +₹{Number(p.amount).toLocaleString('en-IN')}
                            </Text>
                            <View style={styles.payoutMethodBadge}>
                              <Text style={styles.payoutMethodText}>
                                {p.payment_method || (isUPI ? 'UPI' : 'Bank')}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 10. MODAL: Bank & UPI Payout Details */}
      <Modal
        visible={isPayoutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPayoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.payoutHeaderIcon}>
                  <Building2 size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Payout Settings</Text>
                  <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '600' }}>
                    Bank & UPI Payout Details
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsPayoutModalOpen(false)}>
                <X size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Method Switcher */}
              <View style={styles.methodToggleBar}>
                <TouchableOpacity
                  style={[styles.toggleBtn, payoutMethod === 'bank' && styles.toggleBtnActive]}
                  onPress={() => setPayoutMethod('bank')}
                >
                  <Text style={[styles.toggleBtnText, payoutMethod === 'bank' && styles.toggleBtnTextActive]}>
                    🏦 Bank Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, payoutMethod === 'upi' && styles.toggleBtnActive]}
                  onPress={() => setPayoutMethod('upi')}
                >
                  <Text style={[styles.toggleBtnText, payoutMethod === 'upi' && styles.toggleBtnTextActive]}>
                    ⚡ UPI ID
                  </Text>
                </TouchableOpacity>
              </View>

              {payoutMethod === 'bank' ? (
                <View style={{ gap: 10, marginTop: 12 }}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Bank Name</Text>
                    <TextInput
                      value={payoutBankName}
                      onChangeText={setPayoutBankName}
                      placeholder="e.g. State Bank of India, HDFC"
                      placeholderTextColor="#64748b"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Account Number</Text>
                    <TextInput
                      value={payoutAccountNum}
                      onChangeText={setPayoutAccountNum}
                      placeholder="Enter Bank Account Number"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>Confirm Account Number</Text>
                    <TextInput
                      value={payoutConfirmAccountNum}
                      onChangeText={setPayoutConfirmAccountNum}
                      placeholder="Re-enter Bank Account Number"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>IFSC Code (11 Characters)</Text>
                    <TextInput
                      value={payoutIfsc}
                      onChangeText={t => setPayoutIfsc(t.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10, marginTop: 12 }}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>UPI ID (VPA)</Text>
                    <TextInput
                      value={payoutUpiId}
                      onChangeText={setPayoutUpiId}
                      placeholder="yourname@oksbi or mobile@upi"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                  <Text style={styles.hintText}>
                    Ensure your UPI ID is linked to your active bank account. Earnings rewards will be sent directly here.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleSavePayoutDetails}
                disabled={isSavingPayout}
              >
                <LinearGradient
                  colors={['#f59e0b', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSubmitGradient}
                >
                  {isSavingPayout ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveSubmitText}>Save Payout Details</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090514',
  },
  topHeader: {
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerRightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(244,114,182,0.12)',
  },
  headerRightText: {
    color: '#f472b6',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  latestPaidCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(5,150,105,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  latestPaidTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  latestPaidTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  paidBadge: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paidBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  latestPaidDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  latestPaidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  latestPaidMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#ff007a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  balanceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceCardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  currencyBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  currencyBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  balanceBigText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 14,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  balanceSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10.5,
  },
  subVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  updateDetailsCTA: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  updateDetailsCTAText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
  },
  registeredCard: {
    backgroundColor: '#140e2b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  registeredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  registeredCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  registeredEditBtn: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '800',
  },
  registeredDetailsBox: {
    gap: 4,
  },
  regText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  regVal: {
    color: '#ffffff',
    fontWeight: '700',
  },
  regPhoneNote: {
    color: '#64748b',
    fontSize: 10.5,
    marginTop: 4,
  },
  noRegText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sectionHeadTitle: {
    color: '#e2e8f0',
    fontSize: 12.5,
    fontWeight: '800',
  },
  filterPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: '#140e2b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#ff007a',
    borderColor: '#ff007a',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - 40) / 2,
    backgroundColor: '#140e2b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: 2,
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 9.5,
  },
  chartCard: {
    backgroundColor: '#140e2b',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  chartPeakText: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartBarTrack: {
    width: 20,
    height: 65,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarFill: {
    width: 14,
    borderRadius: 6,
  },
  chartBarFillActive: {
    backgroundColor: '#ff007a',
  },
  chartBarFillMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chartBarLabel: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '600',
  },
  chartBarLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  toolbarWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#140e2b',
    borderRadius: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    paddingVertical: 0,
  },
  methodTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#140e2b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 3,
    height: 38,
  },
  methodTab: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  methodTabActive: {
    backgroundColor: 'rgba(244,114,182,0.25)',
  },
  methodTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  methodTabTextActive: {
    color: '#f472b6',
    fontWeight: '800',
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ledgerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  ledgerCountText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#140e2b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  monthGroupCard: {
    backgroundColor: '#140e2b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181033',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  monthName: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  monthCountPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  monthCountText: {
    color: '#cbd5e1',
    fontSize: 9.5,
    fontWeight: '800',
  },
  monthSum: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  payoutList: {
    paddingHorizontal: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  payoutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiBox: {
    backgroundColor: 'rgba(192,132,252,0.18)',
  },
  bankBox: {
    backgroundColor: 'rgba(52,211,153,0.18)',
  },
  payoutTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  viewsBadgeText: {
    color: '#22d3ee',
    fontSize: 10.5,
    fontWeight: '600',
  },
  utrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  utrLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  utrVal: {
    color: '#cbd5e1',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'monospace',
    maxWidth: 120,
  },
  payoutDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  payoutAmount: {
    color: '#34d399',
    fontSize: 13.5,
    fontWeight: '900',
  },
  payoutMethodBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  payoutMethodText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#18122c',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  payoutHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  methodToggleBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: '#271744',
  },
  toggleBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  inputWrap: {
    gap: 4,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  hintText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  saveSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 18,
    marginBottom: 6,
  },
  saveSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
