import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { COLORS } from '../lib/constants';

const TABS = [
  { path: '/', label: '日记', icon: '📖' },
  { path: '/insights', label: '洞察', icon: '📊' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      {TABS.map((tab) => {
        const active = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.navItem}
            onPress={() => router.replace(tab.path as any)}
          >
            <Text style={[styles.navIcon, active && styles.navIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
