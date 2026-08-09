import { useEffect, useState } from "react";
import { View, Text, Linking, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconX } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { usePlatformSettings } from "../../lib/usePlatformSettings";
import { AuthScreenContainer, AuthButton } from "../../components/auth";
import { colors, fonts } from "../../theme";

const SUPPORT_EMAIL = "support@gopher.ng";

export default function VerificationRejectedScreen() {
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [resubmissionCount, setResubmissionCount] = useState(0);
  const { settings } = usePlatformSettings();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("scouts")
        .select("rejection_reason, resubmission_count")
        .eq("profile_id", user.id)
        .maybeSingle();

      setReason(data?.rejection_reason ?? null);
      setResubmissionCount(data?.resubmission_count ?? 0);
      setLoading(false);
    }
    load();
  }, []);

  const attemptsRemaining = settings.resubmissionLimit - resubmissionCount;
  const canResubmit = attemptsRemaining > 0;

  return (
    <AuthScreenContainer
      title="Verification not approved"
      subtitle="Your scout registration was reviewed"
    >
      <View style={styles.checklist}>
        <View style={styles.checklistItem}>
          <IconX size={18} color={colors.error} strokeWidth={2.5} />
          <Text style={styles.item}>Documents did not pass review</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Text style={styles.note}>
            {reason ?? "Your submitted selfie or student ID did not meet our requirements."}
          </Text>

          {canResubmit ? (
            <Text style={styles.attemptsText}>
              You have {attemptsRemaining} of {settings.resubmissionLimit} resubmission
              {attemptsRemaining === 1 ? "" : "s"} remaining.
            </Text>
          ) : (
            <Text style={styles.attemptsText}>
              You've used all {settings.resubmissionLimit} resubmission attempts. Please contact admin
              directly to proceed.
            </Text>
          )}
        </>
      )}

      {canResubmit && !loading && (
        <AuthButton label="Resubmit documents" onPress={() => router.push("/selfie-capture")} />
      )}

      <View style={styles.spacer} />

      <AuthButton
        label="Contact support"
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        variant="secondary"
      />
      <View style={styles.spacer} />
      <AuthButton label="Back to login" onPress={() => router.replace("/login")} />
    </AuthScreenContainer>
  );
}

const styles = StyleSheet.create({
  checklist: {
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  item: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    marginLeft: 10,
  },
  note: {
    color: colors.textPrimary,
    opacity: 0.7,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 19,
  },
  attemptsText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  loader: {
    marginBottom: 24,
  },
  spacer: {
    height: 12,
  },
});
