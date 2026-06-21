import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubscriptionTier } from '../lib/types';
import { isRevenueCatConfigured, waitForPurchasesReady } from '../lib/purchases';
import { loadSubscriptionPackages, subscriptionErrorMessage } from '../lib/subscriptionProducts';

const TIER_KEY = '@mindmirror_tier';
const ENTITLEMENT_ID = 'premium';

function hasPremiumEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[ENTITLEMENT_ID] != null;
}

export function useSubscription() {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [storeUnavailable, setStoreUnavailable] = useState(false);

  const rcConfigured = isRevenueCatConfigured();

  const updateTierFromInfo = useCallback((info: CustomerInfo | null) => {
    const isPremium = hasPremiumEntitlement(info);
    setTier(isPremium ? 'premium' : 'free');
    AsyncStorage.setItem(TIER_KEY, isPremium ? 'premium' : 'free');
  }, []);

  const refreshPackages = useCallback(async (): Promise<PurchasesPackage[]> => {
    const loaded = await loadSubscriptionPackages();
    setPackages(loaded);
    setStoreUnavailable(loaded.length === 0);
    return loaded;
  }, []);

  useEffect(() => {
    if (!rcConfigured) {
      AsyncStorage.getItem(TIER_KEY).then((stored) => {
        setTier(stored === 'premium' ? 'premium' : 'free');
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    let listener: ((info: CustomerInfo) => void) | null = null;

    const setup = async () => {
      const ready = await waitForPurchasesReady();
      if (!ready || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      listener = (info: CustomerInfo) => {
        if (!cancelled) updateTierFromInfo(info);
      };
      Purchases.addCustomerInfoUpdateListener(listener);

      try {
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          updateTierFromInfo(info);
        }

        if (!cancelled) {
          await refreshPackages();
        }
      } catch (err) {
        console.warn('[IAP] setup failed:', err);
        if (!cancelled) {
          const stored = await AsyncStorage.getItem(TIER_KEY);
          setTier(stored === 'premium' ? 'premium' : 'free');
          setStoreUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (listener) {
        Purchases.removeCustomerInfoUpdateListener(listener);
      }
    };
  }, [rcConfigured, updateTierFromInfo, refreshPackages]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!rcConfigured) {
      await AsyncStorage.setItem(TIER_KEY, 'premium');
      setTier('premium');
      Alert.alert('Dev Mode', 'Premium enabled (RevenueCat not configured)');
      return;
    }

    if (!(await waitForPurchasesReady())) {
      Alert.alert('错误', '订阅服务未初始化');
      return;
    }

    if (!pkg.product) {
      Alert.alert('错误', '该订阅商品暂不可用，请稍后再试');
      return;
    }

    setPurchasing(true);
    try {
      // Synthetic packages from getProducts() fallback are not real RC packages.
      const { customerInfo } =
        pkg.offeringIdentifier === 'default' && pkg.product
          ? await Purchases.purchaseStoreProduct(pkg.product)
          : await Purchases.purchasePackage(pkg);
      updateTierFromInfo(customerInfo);
      if (hasPremiumEntitlement(customerInfo)) {
        Alert.alert('感谢订阅！', '你已升级至 MindMirror Premium');
      }
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('购买失败', subscriptionErrorMessage(err));
      }
    } finally {
      setPurchasing(false);
    }
  }, [rcConfigured, updateTierFromInfo]);

  const upgrade = useCallback(async () => {
    if (!rcConfigured) {
      await AsyncStorage.setItem(TIER_KEY, 'premium');
      setTier('premium');
      Alert.alert('Dev Mode', 'Premium enabled (RevenueCat not configured)');
      return;
    }

    if (!(await waitForPurchasesReady())) {
      Alert.alert('错误', '订阅服务未初始化');
      return;
    }

    let available = packages;
    if (available.length === 0) {
      try {
        available = await refreshPackages();
        if (available.length === 0) {
          Alert.alert(
            '订阅暂不可用',
            'App Store 正在同步订阅商品（新配置通常需要 30 分钟到数小时）。\n\n请稍后重试；测试购买请使用沙盒 Apple ID（设置 → App Store → 沙盒账户）。'
          );
          return;
        }
      } catch (err: unknown) {
        Alert.alert('错误', subscriptionErrorMessage(err));
        return;
      }
    }

    const pkg =
      available.find((p) => p.packageType === 'MONTHLY') ??
      available.find((p) => p.packageType === 'ANNUAL') ??
      available[0];

    if (!pkg) {
      Alert.alert('未配置', '没有找到可购买的订阅商品');
      return;
    }

    await purchasePackage(pkg);
  }, [rcConfigured, packages, purchasePackage, refreshPackages]);

  const restore = useCallback(async () => {
    if (!rcConfigured) {
      await AsyncStorage.setItem(TIER_KEY, 'free');
      setTier('free');
      Alert.alert('Dev Mode', 'Premium disabled');
      return;
    }

    if (!(await waitForPurchasesReady())) {
      Alert.alert('错误', '订阅服务未初始化');
      return;
    }

    setLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateTierFromInfo(customerInfo);
      if (hasPremiumEntitlement(customerInfo)) {
        Alert.alert('恢复成功', '你的 Premium 订阅已恢复');
      } else {
        Alert.alert('未找到订阅', '没有检测到此 Apple ID 的活跃订阅');
      }
    } catch (err: unknown) {
      Alert.alert('恢复失败', subscriptionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [rcConfigured, updateTierFromInfo]);

  return {
    tier,
    loading,
    purchasing,
    packages,
    storeUnavailable,
    upgrade,
    restore,
    purchasePackage,
    refreshPackages,
  };
}
