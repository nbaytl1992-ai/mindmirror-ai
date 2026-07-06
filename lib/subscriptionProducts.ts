import Purchases, { type PurchasesPackage } from 'react-native-purchases';

export const IAP_PRODUCT_IDS = {
  monthly: 'com.yantenglong.mindmirror.premium.monthly',
  yearly: 'com.yantenglong.mindmirror.premium.yearly',
} as const;

const PRODUCT_ID_LIST = [IAP_PRODUCT_IDS.monthly, IAP_PRODUCT_IDS.yearly];

function packagesFromOfferings(offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>): PurchasesPackage[] {
  const current = offerings.current?.availablePackages.filter((p) => p.product) ?? [];
  if (current.length > 0) return current;

  for (const offering of Object.values(offerings.all)) {
    const pkgs = offering.availablePackages.filter((p) => p.product);
    if (pkgs.length > 0) return pkgs;
  }
  return [];
}

/** Load RC packages; falls back to direct StoreKit products when offerings are empty. */
export async function loadSubscriptionPackages(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    const fromOfferings = packagesFromOfferings(offerings);
    if (fromOfferings.length > 0) return fromOfferings;
  } catch (err) {
    console.warn('[IAP] getOfferings failed:', err);
  }

  try {
    const products = await Purchases.getProducts(PRODUCT_ID_LIST);
    if (products.length === 0) return [];

    const monthly = products.find((p) => p.identifier === IAP_PRODUCT_IDS.monthly);
    const yearly = products.find((p) => p.identifier === IAP_PRODUCT_IDS.yearly);
    const synthetic: PurchasesPackage[] = [];

    if (monthly) {
      synthetic.push({
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: monthly,
        offeringIdentifier: 'default',
      } as PurchasesPackage);
    }
    if (yearly) {
      synthetic.push({
        identifier: '$rc_annual',
        packageType: 'ANNUAL',
        product: yearly,
        offeringIdentifier: 'default',
      } as PurchasesPackage);
    }
    return synthetic;
  } catch (err) {
    console.warn('[IAP] getProducts fallback failed:', err);
    return [];
  }
}

export function subscriptionErrorMessage(err: unknown): string {
  const raw =
    (err as { message?: string })?.message ||
    (typeof err === 'string' ? err : '') ||
    '未知错误';

  if (raw.includes('None of the products registered')) {
    return (
      'App Store 尚未同步订阅商品（常见于新上架或刚改完定价）。\n\n' +
      '请稍后重试；若持续失败，请确认已用沙盒账号登录，并检查 App Store Connect 中订阅状态为「可供提交」或「已批准」。'
    );
  }
  if (raw.includes('configuration')) {
    return '订阅配置正在同步，请 30 分钟后再试。';
  }
  return raw;
}
