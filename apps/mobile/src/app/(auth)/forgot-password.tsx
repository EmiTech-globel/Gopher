import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconMail, IconKey, IconLock, IconCheck } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { AuthScreenContainer, AuthTextInput, AuthButton, ErrorText } from "../../components/auth";
import { routeAfterAuth } from "../../lib/route-after-auth";
import { colors, fonts } from "../../theme";

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

type Step = "email" | "code" | "newPassword" | "done";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendCode() {
    if (!email.trim()) {
      setErrorMessage("Enter your email.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setStep("code");
  }

  async function handleResendCode() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResending(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setDigits(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function handleDigitChange(text: string, index: number) {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH).split("");
      const next = Array(CODE_LENGTH).fill("");
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, CODE_LENGTH) - 1]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  async function handleVerifyCode() {
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setErrorMessage("Enter the full code from your email.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    // 'recovery' — distinct from the 'signup' OTP type used at
    // registration. Requires the Reset Password email template in the
    // Supabase dashboard to include {{ .Token }} rather than only a
    // magic-link URL, same as the signup template already does — the
    // app has no deep-link/URL-scheme handling set up to catch a link
    // tap, so the code-based template is required, not optional.
    const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!data.session) {
      setErrorMessage("Verification succeeded but no session was returned. Try again.");
      return;
    }
    setStep("newPassword");
  }

  async function handleSetNewPassword() {
    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setStep("done");
  }

  if (step === "email") {
    return (
      <AuthScreenContainer
        title="Forgot password"
        subtitle="Enter your email and we'll send you a code to reset it"
        icon={<IconMail size={28} color={colors.accent} />}
      >
        <AuthTextInput
          label="Email"
          icon={<IconMail size={20} color={colors.textSecondary} strokeWidth={1.75} />}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <ErrorText message={errorMessage} />
        <AuthButton label="Send code" onPress={handleSendCode} loading={loading} style={styles.fullButton} />
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Back to login</Text>
        </Pressable>
      </AuthScreenContainer>
    );
  }

  if (step === "code") {
    return (
      <AuthScreenContainer
        title="Enter the code"
        subtitle={`We sent a 6-digit code to ${email.trim()}`}
        icon={<IconKey size={28} color={colors.accent} />}
      >
        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={styles.codeBox}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>
        <ErrorText message={errorMessage} />
        <AuthButton label="Verify code" onPress={handleVerifyCode} loading={loading} style={styles.fullButton} />
        <Pressable onPress={handleResendCode} disabled={cooldown > 0 || resending}>
          <Text style={styles.backLink}>
            Didn't get it?{" "}
            <Text style={[styles.resendLink, (cooldown > 0 || resending) && styles.resendDisabled]}>
              {resending ? "Sending..." : cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
            </Text>
          </Text>
        </Pressable>
      </AuthScreenContainer>
    );
  }

  if (step === "newPassword") {
    return (
      <AuthScreenContainer
        title="Set a new password"
        subtitle="Choose a new password for your account"
        icon={<IconLock size={28} color={colors.accent} />}
      >
        <AuthTextInput
          label="New password"
          icon={<IconLock size={20} color={colors.textSecondary} strokeWidth={1.75} />}
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <AuthTextInput
          label="Confirm password"
          icon={<IconLock size={20} color={colors.textSecondary} strokeWidth={1.75} />}
          placeholder="Re-enter new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <ErrorText message={errorMessage} />
        <AuthButton label="Update password" onPress={handleSetNewPassword} loading={loading} style={styles.fullButton} />
      </AuthScreenContainer>
    );
  }

  return (
    <AuthScreenContainer title="Password updated" icon={<IconCheck size={28} color={colors.accent} />}>
      <Text style={styles.doneText}>Your password has been changed. You're all set.</Text>
      <AuthButton label="Continue" onPress={() => routeAfterAuth()} style={styles.fullButton} />
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  fullButton: { width: "100%", marginTop: 4, marginBottom: 20 },
  backLink: {
    color: colors.textPrimary, opacity: 0.7, fontFamily: fonts.bodyMedium,
    fontSize: 14, textAlign: "center",
  },
  resendLink: { color: colors.accent, fontFamily: fonts.bodySemiBold, opacity: 1 },
  resendDisabled: { opacity: 0.5 },
  codeRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  codeBox: {
    width: 44, height: 52, borderRadius: 12, backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary, fontFamily: fonts.headingMedium, fontSize: 20,
  },
  doneText: {
    color: colors.textPrimary, opacity: 0.8, fontFamily: fonts.bodyRegular,
    fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24,
  },
});
