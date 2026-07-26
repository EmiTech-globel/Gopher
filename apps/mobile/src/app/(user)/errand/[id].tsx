import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Keyboard } from "react-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  IconArrowLeft, IconChevronDown, IconChevronUp, IconShieldCheck,
  IconStar, IconCheck, IconCash,
} from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { ChatThread } from "../../../components/ChatThread";
import { colors, fonts } from "../../../theme";
import { initiateBalanceTopupPayment } from "../../../lib/paystack";

interface ErrandDetail {
  id: string;
  scout_id: string | null;
  item_description: string;
  status: string;
}

interface ScoutSummary {
  full_name: string;
  trust_tier: "new" | "trusted";
  rating_avg: number | null;
  completed_errands_count: number;
}

const STATUS_STEPS = [
  { key: "accepted", label: "Scout accepted" },
  { key: "purchased", label: "Item purchased" },
  { key: "delivered", label: "On the way to you" },
];

export default function TrackErrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [errand, setErrand] = useState<ErrandDetail | null>(null);
  const [scoutSummary, setScoutSummary] = useState<ScoutSummary | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [pendingRequest, setPendingRequest] = useState<{ id: string; requested_amount: number; reason: string | null } | null>(null);
  const [respondingToRequest, setRespondingToRequest] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const { data: errandRow } = await supabase.from("errands").select("*").eq("id", id).single();
    setErrand(errandRow ?? null);

    if (errandRow?.scout_id) {
      const [{ data: profile }, { data: scout }] = await Promise.all([
        supabase.from("public_profiles").select("full_name").eq("id", errandRow.scout_id).single(),
        supabase.from("public_scouts").select("trust_tier, rating_avg, completed_errands_count").eq("profile_id", errandRow.scout_id).single(),
      ]);

      if (profile && scout) {
        setScoutSummary({
          full_name: profile.full_name ?? "Scout",
          trust_tier: scout.trust_tier ?? "new",
          rating_avg: scout.rating_avg,
          completed_errands_count: scout.completed_errands_count ?? 0,
        });
      }
    } else {
      setScoutSummary(null);
    }

    const { data: balanceRequest } = await supabase
      .from("balance_requests")
      .select("id, requested_amount, reason")
      .eq("errand_id", id)
      .eq("status", "pending")
      .maybeSingle();
    setPendingRequest(balanceRequest ?? null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleApproveFunds() {
    if (!pendingRequest) return;
    setRespondingToRequest(true);
    try {
      await initiateBalanceTopupPayment(pendingRequest.id);
      loadData();
    } catch (err) {
      Alert.alert("Couldn't start payment", err instanceof Error ? err.message : "Try again.");
    } finally {
      setRespondingToRequest(false);
    }
  }

  async function handleDeclineFunds() {
    if (!pendingRequest) return;
    setRespondingToRequest(true);
    const { error } = await supabase
      .from("balance_requests")
      .update({ status: "declined" })
      .eq("id", pendingRequest.id);
    setRespondingToRequest(false);

    if (error) {
      Alert.alert("Couldn't decline", error.message);
      return;
    }
    loadData();
  }

  if (!errand) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === errand.status);
  const initials = scoutSummary?.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Errand in progress</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
        {errand.status === "open" ? (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingText}>Waiting for a Scout to accept this errand.</Text>
          </View>
        ) : expanded ? (
          <>
            <Pressable
              style={styles.minimizeRow}
              onPress={() => {
                if (keyboardVisible) {
                  Keyboard.dismiss();
                  const sub = Keyboard.addListener("keyboardDidHide", () => {
                    setExpanded(false);
                    sub.remove();
                  });
                } else {
                  setExpanded(false);
                }
              }}
            >
              <IconChevronUp size={14} color={colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.minimizeText}>Minimize</Text>
            </Pressable>

            {scoutSummary && (
              <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
                <View style={styles.profileTextBlock}>
                  <Text style={styles.profileName}>{scoutSummary.full_name}</Text>
                  <Text style={styles.profileMeta}>
                    {scoutSummary.trust_tier === "trusted" ? "Trusted" : "New"} · {scoutSummary.completed_errands_count} errands
                  </Text>
                </View>
                {scoutSummary.rating_avg != null && (
                  <View style={styles.ratingRow}>
                    <IconStar size={13} color={colors.warning} strokeWidth={2} />
                    <Text style={styles.ratingText}>{scoutSummary.rating_avg.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.badgeRow}>
              <IconShieldCheck size={15} color={colors.success} strokeWidth={2} />
              <Text style={styles.badgeText}>Payment secured · held safely until delivery</Text>
            </View>

            {pendingRequest && (
              <View style={styles.fundsRequestCard}>
                <View style={styles.fundsRequestHeader}>
                  <IconCash size={16} color={colors.warning} strokeWidth={1.75} />
                  <Text style={styles.fundsRequestTitle}>Additional funds requested</Text>
                </View>
                <Text style={styles.fundsRequestAmount}>₦{pendingRequest.requested_amount.toLocaleString()}</Text>
                {pendingRequest.reason && <Text style={styles.fundsRequestReason}>{pendingRequest.reason}</Text>}
                <View style={styles.fundsRequestButtons}>
                  <Pressable
                    style={styles.declineButton}
                    onPress={handleDeclineFunds}
                    disabled={respondingToRequest}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={styles.approveButton}
                    onPress={handleApproveFunds}
                    disabled={respondingToRequest}
                  >
                    <Text style={styles.approveButtonText}>Approve and pay</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex || errand.status === "confirmed";
                const isCurrent = index === currentStepIndex && errand.status !== "confirmed";
                return (
                  <View key={step.key} style={styles.timelineRow}>
                    {isDone ? (
                      <View style={styles.timelineDotDone}>
                        <IconCheck size={12} color={colors.textPrimary} strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View style={[styles.timelineDot, isCurrent && styles.timelineDotCurrent]} />
                    )}
                    <Text style={[styles.timelineLabel, (isDone || isCurrent) && styles.timelineLabelActive]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {errand.status === "delivered" && (
              <Pressable style={styles.primaryButton} onPress={() => router.push(`/(user)/errand/${errand.id}/confirm`)}>
                <IconCheck size={16} color={colors.deep} strokeWidth={2.25} />
                <Text style={styles.primaryButtonText}>Confirm delivery</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Pressable
            style={styles.miniCard}
            onPress={() => { setExpanded(true); }}
          >
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.miniName}>{scoutSummary?.full_name ?? "Scout"}</Text>
            <View style={styles.miniStatusDot} />
            <IconChevronDown size={16} color={colors.textMuted} strokeWidth={1.75} />
          </Pressable>
        )}
      </ScrollView>

      {errand.status !== "open" && (
        <View style={styles.chatSection}>
          <Text style={styles.chatHeading}>Chat with {scoutSummary?.full_name ?? "Scout"}</Text>
          <ChatThread errandId={errand.id} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, marginBottom: 28,
  },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  detailsScroll: { flexGrow: 0 },
  detailsContent: { paddingHorizontal: 20, paddingBottom: 8 },
  waitingCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center" },
  waitingText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textMuted, textAlign: "center" },
  minimizeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  minimizeText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  miniCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 10, marginBottom: 4,
  },
  miniAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.avatarScout, alignItems: "center", justifyContent: "center", marginRight: 10 },
  miniAvatarText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accentLight },
  miniName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  miniStatusDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.warning, borderWidth: 2, borderColor: colors.accent, marginRight: 10 },
  profileCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.avatarScout, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarInitial: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accentLight },
  profileTextBlock: { flex: 1 },
  profileName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  profileMeta: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginLeft: 4 },
  badgeRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#16A34A22",
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16,
  },
  badgeText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.success, marginLeft: 8, flex: 1 },
  statusLabel: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  fundsRequestCard: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 14, marginBottom: 16 },
  fundsRequestHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  fundsRequestTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary, marginLeft: 6 },
  fundsRequestAmount: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  fundsRequestReason: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  fundsRequestButtons: { flexDirection: "row" },
  declineButton: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle, borderRadius: 10, paddingVertical: 10, alignItems: "center", marginRight: 8 },
  declineButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  approveButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  approveButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  timeline: { marginBottom: 14 },
  timelineRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surfaceElevated, marginRight: 8 },
  timelineDotCurrent: { backgroundColor: "#E0A96A33", borderWidth: 2, borderColor: colors.warning },
  timelineDotDone: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginRight: 8 },
  timelineLabel: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted },
  timelineLabelActive: { fontFamily: fonts.bodyMedium, color: colors.textPrimary },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13, marginBottom: 12,
  },
  primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.deep, marginLeft: 6 },
  chatSection: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceElevated, paddingTop: 10 },
  chatHeading: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, paddingHorizontal: 20, marginBottom: 4 },
});