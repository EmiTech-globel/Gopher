import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  icons: Record<string, IconComponent>;
  badges?: Record<string, number>;
  centerAction?: { icon: IconComponent; onPress: () => void };
}

export function FloatingTabBar({ state, descriptors, navigation, icons, badges, centerAction }: FloatingTabBarProps) {
  const focusedRouteName = state.routes[state.index].name as string;

  // Only ever show the bar while sitting on a real, known tab. Any route
  // not present in `icons` — errand/chat detail screens, notifications,
  // bank-setup, request-funds, edit-profile, etc. — is by definition a
  // pushed screen, not a tab, so it hides automatically. This avoids
  // maintaining a manual prefix list that can silently collide with real
  // tab names (e.g. "errand" as a prefix also matches the real "errands"
  // tab; "chat" as a prefix matches the real "chat" tab on the User side).
  const isOnRealTab = focusedRouteName in icons;
  if (!isOnRealTab) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route: any) => route.name in icons);

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {visibleRoutes.map((route: any) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const TabIcon = icons[route.name];
          const hasBadge = !!badges?.[route.name];

          function handlePress() {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          return (
            <Pressable key={route.key} onPress={handlePress} style={styles.tab}>
              <View>
                <TabIcon size={21} color={isFocused ? colors.warning : colors.navInactive} strokeWidth={1.75} />
                {hasBadge && <View style={styles.badgeDot} />}
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{options.title ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {centerAction && (
        <Pressable style={styles.centerButton} onPress={centerAction.onPress}>
          <centerAction.icon size={22} color={colors.deep} strokeWidth={2.25} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", bottom: 42, left: 16, right: 16, alignItems: "center" },
  pill: {
    flexDirection: "row", backgroundColor: colors.surfaceRaised, borderRadius: 30,
    paddingVertical: 12, paddingHorizontal: 18, justifyContent: "space-between", width: "100%",
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  tab: { alignItems: "center", justifyContent: "center", minWidth: 40 },
  label: { fontSize: 9, fontFamily: fonts.bodyMedium, color: colors.navInactive, marginTop: 3 },
  labelActive: { color: colors.warning },
  badgeDot: { position: "absolute", top: -2, right: -3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.error },
  centerButton: {
    position: "absolute", top: -25, width: 56, height: 56, borderRadius: 50, backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
});