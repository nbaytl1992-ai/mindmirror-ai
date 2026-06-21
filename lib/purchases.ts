import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_API_KEY_IOS, REVENUECAT_API_KEY_ANDROID } from './constants';
import { IAP_PRODUCT_IDS } from './subscriptionProducts';

function getApiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(getApiKey());
}

let readyPromise: Promise<boolean> | null = null;

/** Single-flight configure — safe when multiple screens mount useSubscription. */
export function waitForPurchasesReady(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return Promise.resolve(false);

  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);
        Purchases.configure({ apiKey });
        // Pre-warm StoreKit product cache (helps when RC offerings are still syncing).
        void Purchases.getProducts([
          IAP_PRODUCT_IDS.monthly,
          IAP_PRODUCT_IDS.yearly,
        ]).catch(() => {});
        return true;
      } catch (err) {
        console.warn('[RevenueCat] Configure failed:', err);
        readyPromise = null;
        return false;
      }
    })();
  }

  return readyPromise;
}
