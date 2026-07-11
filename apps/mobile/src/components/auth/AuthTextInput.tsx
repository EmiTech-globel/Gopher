import { forwardRef } from "react";
import { TextInput, type TextInputProps, StyleSheet } from "react-native";

export const AuthTextInput = forwardRef<TextInput, TextInputProps>(
  function AuthTextInput(props, ref) {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor="#D7AEAD80"
        {...props}
        style={[styles.input, props.style]}
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#2A1533",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
  },
});
