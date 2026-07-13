import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  AuthScreenContainer,
  AuthTextInput,
  AuthButton,
  ErrorText,
  EmailOtpStep,
} from "../../components/auth";
import { Pressable, Text } from "react-native";
import { colors, fonts } from "../../theme";

export default function CreateAccountScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);

  async function handleCreateAccount() {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      },
    });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!data.user) {
      setErrorMessage("Something went wrong. Please try again.");
      return;
    }

    setShowOtp(true);
  }

  if (showOtp) {
    return (
      <AuthScreenContainer
        title="Verify your email"
        subtitle="Almost there — confirm your email to finish creating your account"
      >
        <EmailOtpStep
          email={email.trim()}
          onVerified={() => {
            // profiles row already exists via the handle_new_user
            // trigger — nothing else to do for a regular User signup.
          }}
          onContinue={() => router.replace("/login")}
        />
      </AuthScreenContainer>
    );
  }

  return (
    <AuthScreenContainer title="Create your account" subtitle="Join Gopher as a User">
      <AuthTextInput label="Full name" placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <AuthTextInput
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthTextInput
        label="Phone number"
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <AuthTextInput
        label="Password"
        placeholder="At least 6 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AuthTextInput
        label="Confirm password"
        placeholder="Re-enter your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <ErrorText message={errorMessage} />

      <AuthButton label="Continue" onPress={handleCreateAccount} loading={loading} />

      <Pressable onPress={() => router.push("/scout-registration")}>
  <Text style={styles.link}>
    Want to earn instead?{" "}
    <Text style={styles.linkBold}>Become a Scout</Text>
  </Text>
</Pressable>
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    textAlign: "center",
  },
  linkBold: {
    color: colors.accent,
    opacity: 1,
    fontFamily: fonts.bodySemiBold,
  },
});
