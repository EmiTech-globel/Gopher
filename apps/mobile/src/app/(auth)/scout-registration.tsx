import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { getFriendlyErrorMessage } from "../../lib/friendlyError";
import {
  AuthScreenContainer,
  AuthTextInput,
  AuthButton,
  ErrorText,
  EmailOtpStep,
} from "../../components/auth";
import { IconMail, IconUser, IconPhone, IconLock, IconId, IconBuilding } from "@tabler/icons-react-native";
import { colors } from "../../theme";

export const PENDING_MATRIC_KEY = "gopher.pendingMatricNumber";

export default function ScoutRegistrationScreen() {
  // create-account.tsx's "Become a Scout" link passes fresh=1 to
  // explicitly say "treat this as a brand-new signup" — deliberately
  // NOT inferred from session presence alone. Supabase persists
  // sessions across app restarts, so a leftover session from earlier
  // testing (or a previous account on a shared device) would
  // otherwise make this screen wrongly show the short upgrade form
  // to someone who's never actually signed up. Profile's own
  // "Become a Scout" (no fresh param) is the only path that should
  // ever treat an existing session as an upgrade.
  const { fresh } = useLocalSearchParams<{ fresh?: string }>();
  const isFreshSignup = fresh === "1";

  // null while checking, then true/false. An existing logged-in User
  // tapping "Become a Scout" from Profile already has an account,
  // a verified email, and has already accepted Terms & Conditions
  // (routeAfterAuth gates that for every screen past login) — asking
  // them to fill out full name/email/password again and re-verify an
  // OTP was not just redundant, it was actively broken: Supabase
  // deliberately doesn't send a confirmation email for signUp() on an
  // already-registered, already-confirmed address (anti-enumeration
  // protection), so that OTP would silently never arrive.
  const [existingSession, setExistingSession] = useState<boolean | null>(isFreshSignup ? false : null);

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

  useEffect(() => {
    if (isFreshSignup) {
      // Sign out any lingering session so a stale token from earlier
      // testing (or a previous user on a shared device) can't bleed
      // into this signup — e.g. confusing which account the eventual
      // OTP verification and scouts-row insert apply to.
      supabase.auth.signOut();
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setExistingSession(!!session);
    })();
  }, []);

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
      setErrorMessage(getFriendlyErrorMessage(error));
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

  async function handleUpgradeExistingUser() {
    setErrorMessage(null);

    if (!matricNumber.trim() || !department.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setErrorMessage("Your session expired. Please log in again.");
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ department: department.trim() })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
      return;
    }

    await AsyncStorage.setItem(PENDING_MATRIC_KEY, matricNumber.trim());
    router.push("/selfie-capture");
  }

  if (existingSession === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (showOtp) {
    return (
      <AuthScreenContainer
        title="Verify your email"
        subtitle="Almost there — confirm your email to finish creating your account"
        icon={<IconMail size={28} color={colors.accent} />}
      >
        <EmailOtpStep
          email={email.trim()}
          onVerified={() => {
            // Session now exists, but the scouts row isn't created until
            // both photos are captured — see id-capture.tsx.
          }}
          onContinue={() =>
            router.push({ pathname: "/terms-and-conditions", params: { next: "/selfie-capture" } })
          }
        />
      </AuthScreenContainer>
    );
  }

  if (existingSession) {
    return (
      <AuthScreenContainer title="Become a Scout" subtitle="Run errands for other students and earn weekly">
        <AuthTextInput
          label="Matric number"
          icon={<IconId size={14} color={colors.textSecondary} strokeWidth={1.75} />}
          placeholder="M.25/ND/PEG/*****"
          autoCapitalize="characters"
          value={matricNumber}
          onChangeText={setMatricNumber}
        />
        <AuthTextInput
          label="Department"
          icon={<IconBuilding size={14} color={colors.textSecondary} strokeWidth={1.75} />}
          placeholder="Department"
          value={department}
          onChangeText={setDepartment}
        />

        <ErrorText message={errorMessage} />

        <AuthButton label="Continue" onPress={handleUpgradeExistingUser} loading={loading} />
      </AuthScreenContainer>
    );
  }

  return (
    <AuthScreenContainer title="Become a Scout" subtitle="Run errands for other students and earn weekly">
      <AuthTextInput
        label="Full name"
        icon={<IconUser size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
      />
      <AuthTextInput
        label="Email"
        icon={<IconMail size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="Enter your email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthTextInput
        label="Phone number"
        icon={<IconPhone size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <AuthTextInput
        label="Password"
        icon={<IconLock size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="At least 6 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AuthTextInput
        label="Confirm password"
        icon={<IconLock size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="Re-enter your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <AuthTextInput
        label="Matric number"
        icon={<IconId size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="M.25/ND/PEG/*****"
        autoCapitalize="characters"
        value={matricNumber}
        onChangeText={setMatricNumber}
      />
      <AuthTextInput
        label="Department"
        icon={<IconBuilding size={14} color={colors.textSecondary} strokeWidth={1.75} />}
        placeholder="Department"
        value={department}
        onChangeText={setDepartment}
      />

      <ErrorText message={errorMessage} />

      <AuthButton label="Continue" onPress={handleRegister} loading={loading} />
    </AuthScreenContainer>
  );
}