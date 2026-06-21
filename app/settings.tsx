import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import { COLORS } from '../lib/constants';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../lib/legal';

function formatPrice(pkg: any): string {
  const p = pkg?.product;
  if (!p) return '';
  const price = p.priceString || `$${p.price}`;
  if (pkg.packageType === 'ANNUAL') return `${price}/年`;
  if (pkg.packageType === 'MONTHLY') return `${price}/月`;
  return price;
}

function subscriptionPeriodLabel(pkg: any): string {
  if (pkg?.packageType === 'ANNUAL') return '12 个月';
  if (pkg?.packageType === 'MONTHLY') return '1 个月';
  return '';
}

async function openLegalUrl(url: string, label: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('无法打开链接', `${label}：\n${url}`);
  }
}

export default function SettingsScreen() {
  const { tier, upgrade, restore, purchasing, packages, purchasePackage } = useSubscription();
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);

  const monthlyPkg = packages.find((p) => p.packageType === 'MONTHLY');
  const yearlyPkg = packages.find((p) => p.packageType === 'ANNUAL');

  const handleRestore = async () => {
    setRestoring(true);
    await restore();
    setRestoring(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { getEntries, getInsights } = await import('../lib/storage');
      const [entries, insights] = await Promise.all([getEntries(), getInsights()]);
      const payload = {
        app: 'MindMirror AI',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        entryCount: entries.length,
        insightCount: insights.length,
        entries: entries.slice(0, 200),
        insights: insights.slice(0, 50),
      };
      const json = JSON.stringify(payload, null, 2);
      const subject = encodeURIComponent('MindMirror AI 数据导出');
      const body = encodeURIComponent(json.length > 1800 ? json.substring(0, 1800) + '...(数据过长已截断)' : json);
      const mailto = `mailto:?subject=${subject}&body=${body}`;
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
      } else {
        Alert.alert('导出数据', '无法打开邮件应用，请手动备份。');
      }
    } catch (err: any) {
      Alert.alert('导出失败', err.message || '未知错误');
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '清空所有数据',
      '这将删除所有日记和洞察报告，无法恢复。确定吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            const { clearAllData } = await import('../lib/storage');
            await clearAllData();
            Alert.alert('已清空', '所有数据已被删除');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.logo}>⚙️ 设置</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>会员状态</Text>
        <View style={styles.tierCard}>
          <Text style={styles.tierEmoji}>
            {tier === 'premium' ? '👑' : '🔒'}
          </Text>
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>
              {tier === 'premium' ? 'MindMirror Premium' : 'MindMirror Free'}
            </Text>
            <Text style={styles.tierDesc}>
              {tier === 'premium'
                ? '无限日记 · 深度洞察 · AI 回复'
                : `每天${1}篇 · ${7}天历史 · 基础图表`}
            </Text>
          </View>
        </View>

        {tier === 'free' && (
          <View style={styles.paywallBox}>
            <Text style={styles.paywallTitle}>升级到 Premium</Text>
            <View style={styles.featureList}>
              {[
                '无限日记条目',
                '完整历史记录',
                'AI 周度洞察报告',
                '深度情绪分析',
                '无广告体验',
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {purchasing ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.pkgRow}>
                {monthlyPkg && (
                  <TouchableOpacity
                    style={styles.pkgBtn}
                    onPress={() => purchasePackage(monthlyPkg)}
                  >
                    <Text style={styles.pkgPrice}>{formatPrice(monthlyPkg)}</Text>
                    <Text style={styles.pkgLabel}>月度</Text>
                  </TouchableOpacity>
                )}
                {yearlyPkg && (
                  <TouchableOpacity
                    style={[styles.pkgBtn, styles.pkgBtnHighlight]}
                    onPress={() => purchasePackage(yearlyPkg)}
                  >
                    <Text style={[styles.pkgPrice, styles.pkgPriceHighlight]}>{formatPrice(yearlyPkg)}</Text>
                    <Text style={[styles.pkgLabel, styles.pkgLabelHighlight]}>年度 推荐</Text>
                  </TouchableOpacity>
                )}
                {!monthlyPkg && !yearlyPkg && (
                  <TouchableOpacity
                    style={styles.upgradeBtn}
                    onPress={upgrade}
                  >
                    <Text style={styles.upgradeBtnText}>$2.99/月 或 $19.99/年</Text>
                    <Text style={styles.upgradeBtnSub}>邻居咖啡的价格，换取每日心灵成长</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.subscriptionLegal}>
              <Text style={styles.subscriptionLegalTitle}>MindMirror Premium 自动续订订阅</Text>
              {monthlyPkg && (
                <Text style={styles.subscriptionLegalLine}>
                  月度：{formatPrice(monthlyPkg)} · 周期 {subscriptionPeriodLabel(monthlyPkg)}
                </Text>
              )}
              {yearlyPkg && (
                <Text style={styles.subscriptionLegalLine}>
                  年度：{formatPrice(yearlyPkg)} · 周期 {subscriptionPeriodLabel(yearlyPkg)}
                </Text>
              )}
              {!monthlyPkg && !yearlyPkg && (
                <Text style={styles.subscriptionLegalLine}>
                  月度 $2.99/月（1 个月）· 年度 $19.99/年（12 个月）
                </Text>
              )}
              <Text style={styles.subscriptionLegalFine}>
                付款将从 Apple ID 账户扣款；订阅自动续费，除非在当前周期结束前至少 24 小时取消。可在「设置 → Apple ID → 订阅」中管理。
              </Text>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => openLegalUrl(PRIVACY_POLICY_URL, '隐私政策')}>
                  <Text style={styles.legalLink}>隐私政策</Text>
                </TouchableOpacity>
                <Text style={styles.legalSep}>·</Text>
                <TouchableOpacity onPress={() => openLegalUrl(TERMS_OF_USE_URL, '服务条款')}>
                  <Text style={styles.legalLink}>服务条款 (EULA)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.restoreBtnText}>
            {restoring ? '恢复中...' : '恢复购买'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.actionBtnText}>
            {exporting ? '导出中...' : '📤 导出数据'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={handleClearData}
        >
          <Text style={styles.dangerBtnText}>🗑️ 清空所有数据</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>法律信息</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openLegalUrl(PRIVACY_POLICY_URL, '隐私政策')}
        >
          <Text style={styles.actionBtnText}>隐私政策</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openLegalUrl(TERMS_OF_USE_URL, '服务条款')}
        >
          <Text style={styles.actionBtnText}>服务条款 (EULA)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>MindMirror AI v1.0</Text>
        <Text style={styles.footerSub}>数据仅存储在本地设备</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  tierDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  paywallBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paywallTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    width: 20,
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  upgradeBtnSub: {
    fontSize: 12,
    color: '#000',
    opacity: 0.6,
    marginTop: 2,
  },
  pkgRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pkgBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pkgBtnHighlight: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
  },
  pkgPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  pkgPriceHighlight: {
    color: COLORS.primary,
  },
  pkgLabel: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 4,
  },
  pkgLabelHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  subscriptionLegal: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subscriptionLegalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDim,
    marginBottom: 6,
  },
  subscriptionLegalLine: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  subscriptionLegalFine: {
    fontSize: 11,
    color: COLORS.textDim,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legalLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  legalSep: {
    fontSize: 12,
    color: COLORS.textDim,
    marginHorizontal: 6,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  dangerBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
    alignItems: 'center',
    marginTop: 8,
  },
  dangerBtnText: {
    fontSize: 14,
    color: COLORS.danger,
  },
  actionBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  footerSub: {
    fontSize: 11,
    color: COLORS.textDim,
    opacity: 0.6,
    marginTop: 2,
  },
});
