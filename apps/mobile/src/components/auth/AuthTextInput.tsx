import { forwardRef, useState, type ReactNode } from "react";
import { View, Text, TextInput, type TextInputProps, StyleSheet, Pressable } from "react-native";
import { IconEye, IconEyeOff } from "@tabler/icons-react-native";
import { colors, fonts } from "../../theme";

interface AuthTextInputProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
  isPassword?: boolean;
}

export const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(
  function AuthTextInput({ label, icon, style, isPassword, ...props }, ref) {
    const [hidden, setHidden] = useState(true);

    return (
      <View style={styles.field}>
        {label && (
          <View style={styles.labelRow}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textSecondary + "80"}
            secureTextEntry={isPassword ? hidden : props.secureTextEntry}
            {...props}
            style={[styles.input, style, isPassword && { paddingRight: 48 }]}
          />
          {isPassword && (
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setHidden(!hidden)}
            >
              {hidden ? (
                <IconEyeOff size={20} color={colors.textSecondary} />
              ) : (
                <IconEye size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          )}
        </View>
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
  inputContainer: {
    justifyContent: "center",
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
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
});