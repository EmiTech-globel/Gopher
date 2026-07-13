import { View, Text, Pressable, StyleSheet } from "react-native";
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
  const CenterIcon = centerAction!.icon;

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
            <Pressable key={route.key} style={styles.tab} onPress={handlePress}>
              <TabIcon
                size={22}
                color={isFocused ? colors.accent : colors.textSecondary}
                strokeWidth={isFocused ? 2.25 : 1.75}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {centerAction && (
        <Pressable style={styles.centerButton} onPress={centerAction.onPress}>
          <CenterIcon size={26} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    minWidth: 56,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.accent,
  },
  centerButton: {
    position: "absolute",
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});