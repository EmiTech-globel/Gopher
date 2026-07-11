import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
} from "react-native";

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
        <ActivityIndicator color="#D7AEAD" />
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
    backgroundColor: "#532B59",
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
    color: "#D7AEAD",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    opacity: 0.8,
    fontWeight: "500",
  },
});
