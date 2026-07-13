import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { IconCheck } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { AuthButton } from "./AuthButton";
import { ErrorText } from "./ErrorText";
import { colors, fonts } from "../../theme";

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_LENGTH = 6;

interface EmailOtpStepProps {
  email: string;
  onVerified: (session: Session) => void | Promise<void>;
  onContinue: () => void;
}

export function EmailOtpStep({ email, onVerified, onContinue }: EmailOtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(text: string, index: number) {
    const cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH).split("");
      const next = Array(CODE_LENGTH).fill("");
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
      inputRefs.current[lastFilled]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    setErrorMessage(null);

    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setErrorMessage("Enter the full code from your email.");
      return;
    }

    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
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
    setDigits(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (verified) {
    return (
      <View style={styles.centered}>
        <View style={styles.checkCircle}>
          <IconCheck size={32} color={colors.textPrimary} strokeWidth={3} />
        </View>
        <Text style={styles.verifiedText}>Email verified</Text>
        <AuthButton label="Continue" onPress={onContinue} style={styles.continueButton} />
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.subtitle}>
        Please enter the verification code we sent to{"\n"}
        <Text style={styles.emailText}>{email}</Text>
      </Text>

      <View style={styles.codeRow}>
        {digits.map((digit, index) => (
          <View key={index} style={styles.boxWrapper}>
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.box}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              textAlign="center"
              autoFocus={index === 0}
            />
            {index === 2 && <Text style={styles.dash}>—</Text>}
          </View>
        ))}
      </View>

      <ErrorText message={errorMessage} />

      <AuthButton
        label="Confirm"
        onPress={handleVerify}
        loading={verifying}
        style={styles.confirmButton}
      />

      <Pressable onPress={handleResend} disabled={cooldown > 0 || resending}>
        <Text style={styles.resendRow}>
          Didn't receive the code?{" "}
          <Text style={[styles.resendLink, (cooldown > 0 || resending) && styles.resendDisabled]}>
            {resending ? "Sending..." : cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
  },
  subtitle: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  emailText: {
    color: colors.textPrimary,
    opacity: 1,
    fontFamily: fonts.bodySemiBold,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  boxWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontFamily: fonts.headingMedium,
    fontSize: 20,
    marginHorizontal: 4,
  },
  dash: {
    color: colors.textSecondary,
    opacity: 0.6,
    fontSize: 18,
    marginHorizontal: 2,
  },
  confirmButton: {
    width: "100%",
  },
  resendRow: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    textAlign: "center",
  },
  resendLink: {
    color: colors.accent,
    fontFamily: fonts.bodySemiBold,
    opacity: 1,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  verifiedText: {
    color: colors.accent,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    marginBottom: 24,
  },
  continueButton: {
    width: "100%",
  },
});