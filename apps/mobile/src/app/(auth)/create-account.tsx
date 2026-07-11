import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  AuthScreenContainer,
  AuthTextInput,
  AuthButton,
  ErrorText,
  EmailOtpStep,
} from "../../components/auth";

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
      <AuthTextInput placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <AuthTextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthTextInput
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <AuthTextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AuthTextInput
        placeholder="Confirm password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <ErrorText message={errorMessage} />

      <AuthButton label="Continue" onPress={handleCreateAccount} loading={loading} />

      <View>
        <AuthButton
          label="Want to earn instead? Become a Scout"
          variant="secondary"
          onPress={() => router.push("/scout-registration")}
        />
      </View>
    </AuthScreenContainer>
  );
}
