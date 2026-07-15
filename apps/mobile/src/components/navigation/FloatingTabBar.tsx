import { View, Pressable, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  icons: Record<string, IconComponent>;
  centerAction?: {
    icon: IconComponent;
    onPress: () => void;
  };
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  icons,
  centerAction,
}: FloatingTabBarProps) {
  const visibleRoutes = state.routes.filter((route: any) => route.name in icons);

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {visibleRoutes.map((route: any) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const TabIcon = icons[route.name];

          function handlePress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <TabIcon
                size={20}
                color={isFocused ? colors.primary : colors.textSecondary}
                strokeWidth={isFocused ? 2.25 : 1.75}
              />
            </Pressable>
          );
        })}
      </View>

      {centerAction && (
        <Pressable style={styles.centerButton} onPress={centerAction.onPress}>
          <centerAction.icon size={26} color={colors.primary} strokeWidth={2.25} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 42,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "space-around",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  centerButton: {
    position: "absolute",
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});