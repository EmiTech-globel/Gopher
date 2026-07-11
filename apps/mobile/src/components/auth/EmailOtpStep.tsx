import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { AuthTextInput } from "./AuthTextInput";
import { AuthButton } from "./AuthButton";
import { ErrorText } from "./ErrorText";

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailOtpStepProps {
  email: string;
  // Fired once verifyOtp succeeds. supabase's client already has the new
  // session active by this point (verifyOtp sets it internally, same as
  // setSession) — any .from() calls made inside this callback are
  // already authenticated.
  onVerified: (session: Session) => void | Promise<void>;
  onContinue: () => void;
}

export function EmailOtpStep({ email, onVerified, onContinue }: EmailOtpStepProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // The initial code was already sent by signUp() right before this step
  // mounted, so the cooldown starts immediately rather than waiting for
  // a manual resend tap.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    setErrorMessage(null);

    const trimmed = code.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      setErrorMessage("Enter the code from your email.");
      return;
    }

    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: trimmed,
      type: "signup",
    });
    setVerifying(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!data.session) {
      setErrorMessage("Verification succeeded but no session was returned. Please try logging in.");
      return;
    }

    setVerified(true);
    await onVerified(data.session);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;

    setErrorMessage(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (verified) {
    return (
      <View style={styles.centered}>
        {/* Tabler Icons for React Native isn't installed yet — swap this
            for <IconCheck /> once that package is added, per the design
            system's icon-only rule (no emojis). */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.verifiedText}>Email verified</Text>
        <AuthButton label="Continue" onPress={onContinue} style={styles.continueButton} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>Enter the code sent to {email}</Text>
      <AuthTextInput
        placeholder="Confirmation code"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={10}
      />
      <ErrorText message={errorMessage} />
      <AuthButton label="Verify" onPress={handleVerify} loading={verifying} />
      <Pressable onPress={handleResend} disabled={cooldown > 0 || resending}>
        <Text style={[styles.resendText, (cooldown > 0 || resending) && styles.resendDisabled]}>
          {resending ? "Sending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
  },
  label: {
    color: "#FFFFFF",
    opacity: 0.8,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  resendText: {
    color: "#D7AEAD",
    fontSize: 14,
    textAlign: "center",
    marginTop: -8,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  verifiedText: {
    color: "#D7AEAD",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 24,
  },
  continueButton: {
    width: "100%",
  },
});
