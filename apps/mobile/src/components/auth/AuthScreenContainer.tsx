import { ReactNode } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";

interface AuthScreenContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthScreenContainer({ title, subtitle, children }: AuthScreenContainerProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#1A0E22",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    color: "#D7AEAD",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
});
