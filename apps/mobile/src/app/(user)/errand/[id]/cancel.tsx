import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { IconArrowLeft, IconAlertTriangle } from "@tabler/icons-react-native";
import { supabase } from "../../../../lib/supabase";
import { colors, fonts } from "../../../../theme";

// Section 9: "2-3 min grace window after accept" — full refund, no
// reputation ding, if the requester cancels within this window.
const GRACE_WINDOW_MINUTES = 3;

interface ErrandRow {
  id: string;
  status: string;
  accepted_at: string | null;
}

export default function CancelErrandScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [errand, setErrand] = useState<ErrandRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data } = await supabase.from("errands").select("id, status, accepted_at").eq("id", id).single();
      setErrand(data ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !errand) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Item already purchased or further along — this is no longer a simple
  // cancellation per Section 9 ("Not a simple refund... becomes a dispute
  // case"), so this screen doesn't offer a cancel action at all.
  if (!["open", "accepted"].includes(errand.status)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.header} onPress={() => router.back()}>
          <IconArrowLeft size={22} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.headerTitle}>Cancel errand</Text>
        </Pressable>
        <View style={styles.blockedCard}>
          <IconAlertTriangle size={20} color={colors.warning} strokeWidth={1.75} />
          <Text style={styles.blockedText}>
            Your scout has already bought the item, so this can no longer be cancelled directly.
            If something's wrong, report an issue instead.
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.push(`/(user)/dispute/${errand.id}`)}>
            <Text style={styles.secondaryButtonText}>Report an issue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const withinGrace =
    errand.status === "accepted" &&
    errand.accepted_at &&
    Date.now() - new Date(errand.accepted_at).getTime() <= GRACE_WINDOW_MINUTES * 60 * 1000;

  const hasReputationRisk = errand.status === "accepted" && !withinGrace;

  async function handleConfirmCancel() {
    if (!errand) return;
    setCancelling(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("errands")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", errand.id);

    setCancelling(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/(user)/home");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable style={styles.header} onPress={() => router.back()}>
        <IconArrowLeft size={22} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={styles.headerTitle}>Cancel errand</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You'll get a full refund</Text>
        <Text style={styles.cardBody}>
          Both your item budget and delivery fee will be refunded in full. The processing fee
          from checkout is non-refundable, per Paystack's policy — this applies to every
          cancellation.
        </Text>
      </View>

      {hasReputationRisk && (
        <View style={styles.warningCard}>
          <IconAlertTriangle size={16} color={colors.warning} strokeWidth={1.75} />
          <Text style={styles.warningText}>
            Since it's been more than {GRACE_WINDOW_MINUTES} minutes since your scout accepted,
            cancelling now will add a ding to your reputation. Repeated cancellations after
            acceptance may affect how quickly scouts pick up your future errands.
          </Text>
        </View>
      )}

      {errand.status === "accepted" && withinGrace && (
        <Text style={styles.graceNote}>
          You're still within the {GRACE_WINDOW_MINUTES}-minute grace window — no reputation
          impact for cancelling now.
        </Text>
      )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Pressable style={styles.confirmButton} onPress={handleConfirmCancel} disabled={cancelling}>
        {cancelling ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm cancellation</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} disabled={cancelling}>
        <Text style={styles.keepText}>Keep errand</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, paddingHorizontal: 20 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.textPrimary },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
  cardBody: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary, lineHeight: 19 },
  warningCard: {
    flexDirection: "row", gap: 10, backgroundColor: "rgba(224,169,106,0.14)",
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  warningText: { flex: 1, fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.warning, lineHeight: 18 },
  graceNote: {
    fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.success,
    marginBottom: 16, textAlign: "center",
  },
  errorText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.error, marginBottom: 12, textAlign: "center" },
  confirmButton: {
    backgroundColor: colors.error, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginBottom: 14,
  },
  confirmButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  keepText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  blockedCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center", gap: 12 },
  blockedText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary, textAlign: "center", lineHeight: 19 },
  secondaryButton: {
    backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 22, marginTop: 6,
  },
  secondaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.deep },
});
