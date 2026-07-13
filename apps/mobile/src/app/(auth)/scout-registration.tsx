import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import {
  AuthScreenContainer,
  AuthTextInput,
  AuthButton,
  ErrorText,
  EmailOtpStep,
} from "../../components/auth";
import { IconMail } from "@tabler/icons-react-native";
import { colors } from "../../theme";

export const PENDING_MATRIC_KEY = "gopher.pendingMatricNumber";

export default function ScoutRegistrationScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);

  async function handleRegister() {
    setErrorMessage(null);

    if (!fullName.trim() || !matricNumber.trim() || !department.trim()) {
      setErrorMessage("Please fill in all fields.");
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
          department: department.trim(),
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

    // matric_number has no home in profiles/the signup trigger — stash
    // it locally and insert it into `scouts` at the end of the capture
    // flow (id-capture.tsx), once selfie + ID are uploaded too.
    await AsyncStorage.setItem(PENDING_MATRIC_KEY, matricNumber.trim());
    setShowOtp(true);
  }

  if (showOtp) {
    return (
<AuthScreenContainer
  title="Verify your email"
  subtitle="Almost there — confirm your email to finish creating your account"
  icon={<IconMail size={28} color={colors.accent}  />}
>
        <EmailOtpStep
          email={email.trim()}
          onVerified={() => {
            // Session now exists, but the scouts row isn't created until
            // both photos are captured — see id-capture.tsx.
          }}
          onContinue={() => router.push("/selfie-capture")}
        />
      </AuthScreenContainer>
    );
  }

  return (
    <AuthScreenContainer title="Become a Scout" subtitle="Run errands for other students and earn weekly">
      <AuthTextInput
        label="Full name"
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
      />
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
      <AuthTextInput
        label="Matric number"
        placeholder="M.25/ND/PEG/*****"
        autoCapitalize="characters"
        value={matricNumber}
        onChangeText={setMatricNumber}
      />
      <AuthTextInput 
      label="Department" 
      placeholder="Department" 
      value={department} 
      onChangeText={setDepartment} 
      />

      <ErrorText message={errorMessage} />

      <AuthButton label="Continue" onPress={handleRegister} loading={loading} />
    </AuthScreenContainer>
  );
}
