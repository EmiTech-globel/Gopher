import { forwardRef, type ReactNode } from "react";
import { View, Text, TextInput, type TextInputProps, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

interface AuthTextInputProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
}

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(
  function AuthTextInput({ label, icon, style, ...props }, ref) {
    return (
      <View style={styles.field}>
        {label && (
          <View style={styles.labelRow}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSecondary + "80"}
          {...props}
          style={[styles.input, style]}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
});