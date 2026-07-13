import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
} from "react-native";
import { colors, fonts } from "../../theme";

interface AuthButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function AuthButton({
  label,
  loading,
  variant = "primary",
  disabled,
  style,
  ...rest
}: AuthButtonProps) {
  return (
    <Pressable
      style={[styles.button, variant === "secondary" && styles.secondary, style as object]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  secondary: {
    backgroundColor: "transparent",
  },
  text: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  secondaryText: {
    opacity: 0.8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});