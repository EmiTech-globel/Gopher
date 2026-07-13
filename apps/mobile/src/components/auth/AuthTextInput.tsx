import { forwardRef } from "react";
import { View, Text, TextInput, type TextInputProps, StyleSheet } from "react-native";
import { colors, fonts } from "../../theme";

interface AuthTextInputProps extends TextInputProps {
  label?: string;
}

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(
  function AuthTextInput({ label, style, ...props }, ref) {
    return (
      <View style={styles.field}>
        {label && <Text style={styles.label}>{label}</Text>}
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
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: 6,
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