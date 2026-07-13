import { ReactNode } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

interface AuthScreenContainerProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function AuthScreenContainer({ title, subtitle, icon, children }: AuthScreenContainerProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
      <Text style={styles.brand}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.surfaceBase,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 62,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  brand: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    color: colors.accent,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textPrimary,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 30,
  },
});