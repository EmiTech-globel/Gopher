import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Keyboard, Linking,
} from "react-native";
import { useEffect } from "react";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import {
  IconArrowLeft, IconChevronDown, IconChevronUp, IconPhone,
  IconShieldCheck, IconBuildingStore, IconMapPin, IconCheck, IconAlertCircle, IconAlertTriangle,
} from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { ChatThread } from "../../../components/ChatThread";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { colors, fonts } from "../../../theme";
import { getCounterpartPhone, revealMyPhone, autoRevealIfDefaultOn } from "../../../lib/phoneReveal";

interface ErrandDetail {
  id: string;
  requester_id: string;
  item_description: string;
  pickup_location: string;
  dropoff_location: string;
  item_budget: number;
  delivery_fee: number;
  status: string;
  scout_phone_revealed: boolean;
}

const CHARGES_FEE_RATE = 0.18;

export default function ScoutErrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [errand, setErrand] = useState<ErrandDetail | null>(null);
  const [requesterName, setRequesterName] = useState("User");
  const [trustTier, setTrustTier] = useState<"new" | "trusted">("new");
  const [expanded, setExpanded] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fundsModalVisible, setFundsModalVisible] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [balanceRequestStatus, setBalanceRequestStatus] = useState<string | null>(null);
  const [counterpartPhone, setCounterpartPhone] = useState<string | null>(null);
  const [myPhoneRevealed, setMyPhoneRevealed] = useState(false);
  const [phoneConfirmVisible, setPhoneConfirmVisible] = useState(false);
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const [{ data: errandRow }, { data: scout }] = await Promise.all([
      supabase.from("errands").select("*").eq("id", id).single(),
      supabase.from("scouts").select("trust_tier").eq("profile_id", user.id).single(),
    ]);

    if (errandRow) {
      setErrand(errandRow);
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("full_name")
        .eq("id", errandRow.requester_id)
        .single();
      if (profile?.full_name) setRequesterName(profile.full_name);

      if (errandRow.status !== "open") {
        await autoRevealIfDefaultOn(errandRow.id);
        const phone = await getCounterpartPhone(errandRow.id);
        setCounterpartPhone(phone);
        setMyPhoneRevealed(errandRow.scout_phone_revealed);
      }
    }

    const { data: latestRequest } = await supabase
      .from("balance_requests")
      .select("status")
      .eq("errand_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setBalanceRequestStatus(latestRequest?.status ?? null);
    setTrustTier(scout?.trust_tier ?? "new");
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`errand-live:${id}:${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "errands", filter: `id=eq.${id}` },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, loadData]);

  // So the scout sees an "approved"/"declined"/"expired" status update the
  // instant it happens, without leaving and re-entering the screen.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`errand-balance-requests:${id}:${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "balance_requests", filter: `errand_id=eq.${id}` },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, loadData]);

  function handlePhonePress() {
    if (!errand) return;
    if (counterpartPhone) {
      Linking.openURL(`tel:${counterpartPhone}`);
      return;
    }
    if (!myPhoneRevealed) {
      setPhoneConfirmVisible(true);
    }
  }

  async function handleConfirmReveal() {
    if (!errand) return;
    setPhoneConfirmVisible(false);
    await revealMyPhone(errand.id);
    setMyPhoneRevealed(true);
  }

  async function handleAcceptFromDetail() {
    if (!errand) return;
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUpdating(false); return; }

    const { data, error } = await supabase
      .from("errands")
      .update({ scout_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", errand.id)
      .eq("status", "open")
      .select()
      .maybeSingle();

    setUpdating(false);
    if (error) { Alert.alert("Couldn't accept errand", error.message); return; }
    if (!data) { Alert.alert("Too late", "Another scout already accepted this errand."); loadData(); return; }
    loadData();
  }

  async function handleMarkPurchased() {
    if (!errand) return;
    if (trustTier === "new") {
      router.push(`/(scout)/proof-of-purchase/${errand.id}`);
      return;
    }
    setUpdating(true);
    const { error } = await supabase
      .from("errands")
      .update({ status: "purchased", purchased_at: new Date().toISOString() })
      .eq("id", errand.id);
    setUpdating(false);
    if (error) { Alert.alert("Couldn't update", error.message); return; }
    loadData();
  }

  async function handleMarkDelivered() {
    if (!errand) return;
    setUpdating(true);
    const { error } = await supabase
      .from("errands")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", errand.id);
    setUpdating(false);
    if (error) { Alert.alert("Couldn't update", error.message); return; }
    loadData();
  }

  async function handleSubmitFundsRequest() {
    if (!errand) return;
    const amount = parseFloat(requestedAmount);
    if (!amount || amount <= 0) { Alert.alert("Invalid amount", "Enter a valid additional amount."); return; }

    setSubmittingRequest(true);
    const { error } = await supabase.from("balance_requests").insert({
      errand_id: errand.id,
      requested_amount: amount,
      reason: requestReason.trim() || null,
      status: "pending",
    });
    setSubmittingRequest(false);

    if (error) { Alert.alert("Couldn't send request", error.message); return; }
    setFundsModalVisible(false);
    setRequestedAmount("");
    setRequestReason("");
    loadData();
  }

  async function handleCancelWithoutPenalty() {
    if (!errand) return;
    setCancelConfirmVisible(false);
    setUpdating(true);
    const { error } = await supabase
      .from("errands")
      .update({ scout_id: null, status: "open", accepted_at: null })
      .eq("id", errand.id);
    setUpdating(false);
    if (error) { Alert.alert("Couldn't cancel", error.message); return; }
    router.replace("/(scout)/home");
  }

  if (!errand) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const netEarn = errand.delivery_fee * (1 - CHARGES_FEE_RATE);
  const initials = requesterName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Errand details</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView style={styles.detailsScroll} contentContainerStyle={styles.detailsContent}>
        {errand.status === "open" ? (
          <View style={styles.openCard}>
            <Text style={styles.itemText}>{errand.item_description}</Text>
            <View style={styles.routeRow}>
              <IconMapPin size={14} color={colors.textSecondary} strokeWidth={1.75} />
              <Text style={styles.routeText}>{errand.pickup_location} → {errand.dropoff_location}</Text>
            </View>
            <View style={styles.amountsRow}>
              <View>
                <Text style={styles.amountLabel}>Item budget</Text>
                <Text style={styles.amountValue}>₦{errand.item_budget.toLocaleString()}</Text>
              </View>
              <View>
                <Text style={styles.amountLabel}>You earn</Text>
                <Text style={[styles.amountValue, { color: colors.success }]}>₦{netEarn.toLocaleString()}</Text>
              </View>
            </View>
            <Pressable style={styles.primaryButton} onPress={handleAcceptFromDetail} disabled={updating}>
              {updating ? <ActivityIndicator color={colors.deep} /> : <Text style={styles.primaryButtonText}>Accept errand</Text>}
            </Pressable>
          </View>
        ) : expanded ? (
          <>
            <Pressable
              style={styles.minimizeRow}
              onPress={() => { Keyboard.dismiss(); setExpanded(false); }}
            >
              <IconChevronUp size={14} color={colors.textMuted} strokeWidth={1.75} />
              <Text style={styles.minimizeText}>Minimize</Text>
            </Pressable>

            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
              <View style={styles.profileTextBlock}>
                <Text style={styles.profileName}>{requesterName}</Text>
                <Text style={styles.profileMeta}>{errand.dropoff_location}</Text>
              </View>
              <Pressable style={styles.phoneButton} onPress={handlePhonePress}>
                <IconPhone size={16} color={counterpartPhone ? colors.success : colors.textSecondary} strokeWidth={1.75} />
              </Pressable>
            </View>

            <View style={styles.badgeRow}>
              <IconShieldCheck size={15} color={colors.success} strokeWidth={2} />
              <Text style={styles.badgeText}>Payment secured · safe to proceed</Text>
            </View>

            {["accepted", "purchased", "delivered", "disputed"].includes(errand.status) && (
              <Pressable
                style={styles.reportIssueRow}
                onPress={() => router.push(`/(scout)/dispute/${errand.id}`)}
              >
                <IconAlertTriangle size={14} color={colors.error} strokeWidth={1.75} />
                <Text style={styles.reportIssueText}>
                  {errand.status === "disputed" ? "View dispute status" : "Report an issue"}
                </Text>
              </Pressable>
            )}

            {balanceRequestStatus === "declined" && (
              <View style={styles.statusNoteCard}>
                <Text style={styles.statusNoteText}>Your last funds request was declined.</Text>
              </View>
            )}
            {balanceRequestStatus === "approved" && (
              <View style={[styles.statusNoteCard, styles.statusNoteApproved]}>
                <Text style={[styles.statusNoteText, { color: colors.success }]}>Your additional funds request was approved and paid.</Text>
              </View>
            )}

            <View style={styles.taskCard}>
              <Text style={styles.taskLabel}>Buy</Text>
              <Text style={styles.taskItem}>{errand.item_description}</Text>
              <View style={styles.taskLocationRow}>
                <IconBuildingStore size={13} color={colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.taskLocationText}>{errand.pickup_location}</Text>
              </View>
              <View style={styles.taskLocationRow}>
                <IconMapPin size={13} color={colors.textMuted} strokeWidth={1.75} />
                <Text style={styles.taskLocationText}>Deliver to {errand.dropoff_location}</Text>
              </View>
            </View>

            <View style={styles.amountsRow}>
              <View>
                <Text style={styles.amountLabel}>Item budget</Text>
                <Text style={styles.amountValue}>₦{errand.item_budget.toLocaleString()}</Text>
              </View>
              <View>
                <Text style={styles.amountLabel}>You earn</Text>
                <Text style={[styles.amountValue, { color: colors.success }]}>₦{netEarn.toLocaleString()}</Text>
              </View>
            </View>

            {errand.status === "accepted" && (
              <>
                <Pressable style={styles.primaryButton} onPress={handleMarkPurchased} disabled={updating}>
                  <IconCheck size={16} color={colors.deep} strokeWidth={2.25} />
                  <Text style={styles.primaryButtonText}>
                    {trustTier === "new" ? "Submit proof of purchase" : "Mark as purchased"}
                  </Text>
                </Pressable>
                <Pressable style={styles.outlineButton} onPress={() => router.push(`/(scout)/request-funds/${errand.id}`)}>
                  <IconAlertCircle size={15} color={colors.textSecondary} strokeWidth={1.75} />
                  <Text style={styles.outlineButtonText}>Request additional funds</Text>
                </Pressable>
                {balanceRequestStatus === "expired" && (
                  <View style={styles.expiredCard}>
                    <Text style={styles.expiredText}>
                      Your funds request expired without a response.
                    </Text>
                    <Pressable style={styles.cancelButton} onPress={() => setCancelConfirmVisible(true)} disabled={updating}>
                      <Text style={styles.cancelButtonText}>Cancel errand (no penalty)</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {errand.status === "purchased" && (
              <Pressable style={styles.primaryButton} onPress={handleMarkDelivered} disabled={updating}>
                <Text style={styles.primaryButtonText}>Mark as delivered</Text>
              </Pressable>
            )}

            {errand.status === "delivered" && (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingText}>Waiting for the user to confirm delivery.</Text>
              </View>
            )}
          </>
        ) : (
          <Pressable
            style={styles.miniCard}
            onPress={() => { Keyboard.dismiss(); setExpanded(true); }}
          >
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.miniName}>{requesterName}</Text>
            <View style={styles.miniStatusDot} />
            <IconChevronDown size={16} color={colors.textMuted} strokeWidth={1.75} />
          </Pressable>
        )}
      </ScrollView>

      {errand.status !== "open" && (
        <View style={styles.chatSection}>
          <Text style={styles.chatHeading}>Chat with {requesterName}</Text>
          <ChatThread errandId={errand.id} />
        </View>
      )}

      <Modal visible={fundsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Request additional funds</Text>
            <Text style={styles.modalSubtitle}>If the item costs more than expected, request the difference before buying.</Text>
            <Text style={styles.label}>Additional amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 300"
              placeholderTextColor={colors.textSecondary + "80"}
              keyboardType="numeric"
              value={requestedAmount}
              onChangeText={setRequestedAmount}
            />
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="e.g. Price went up at the shop"
              placeholderTextColor={colors.textSecondary + "80"}
              value={requestReason}
              onChangeText={setRequestReason}
              multiline
            />
            <Pressable style={styles.primaryButton} onPress={handleSubmitFundsRequest} disabled={submittingRequest}>
              {submittingRequest ? <ActivityIndicator color={colors.deep} /> : <Text style={styles.primaryButtonText}>Send request</Text>}
            </Pressable>
            <Pressable onPress={() => setFundsModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={phoneConfirmVisible}
        title="Share your number?"
        message="This reveals your phone number to the requester for this errand."
        confirmLabel="Share"
        onConfirm={handleConfirmReveal}
        onCancel={() => setPhoneConfirmVisible(false)}
      />

      <ConfirmDialog
        visible={cancelConfirmVisible}
        title="Cancel this errand?"
        message="It returns to the open pool for another scout to accept. Since your funds request expired without a response, this won't affect your reputation."
        confirmLabel="Cancel errand"
        onConfirm={handleCancelWithoutPenalty}
        onCancel={() => setCancelConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.textPrimary },
  detailsScroll: { flexGrow: 0 },
  detailsContent: { paddingHorizontal: 20, paddingBottom: 8 },
  minimizeRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  minimizeText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginLeft: 4 },
  miniCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 10, marginBottom: 4,
  },
  miniAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 10 },
  miniAvatarText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.deep },
  miniName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  miniStatusDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.warning, borderWidth: 2, borderColor: colors.accent, marginRight: 10 },
  profileCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarInitial: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.deep },
  profileTextBlock: { flex: 1 },
  profileName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  profileMeta: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  phoneButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  badgeRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#16A34A22",
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16,
  },
  badgeText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.success, marginLeft: 8 },
  reportIssueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  reportIssueText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.error },
  statusNoteCard: { backgroundColor: colors.surfaceElevated, borderRadius: 10, padding: 12, marginBottom: 16 },
  statusNoteApproved: { backgroundColor: "#16A34A22" },
  statusNoteText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textSecondary, textAlign: "center" },
  taskCard: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 12, marginBottom: 16 },
  taskLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  taskItem: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
  taskLocationRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  taskLocationText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginLeft: 6 },
  amountsRow: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  amountLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted },
  amountValue: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.textPrimary, marginTop: 4 },
  itemText: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  routeText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, marginLeft: 6 },
  openCard: { paddingBottom: 8 },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13, marginBottom: 10,
  },
  primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.deep, marginLeft: 6 },
  outlineButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
    borderRadius: 12, paddingVertical: 13, marginBottom: 12,
  },
  outlineButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary, marginLeft: 6 },
  waitingCard: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12 },
  waitingText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
  chatSection: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceElevated, paddingTop: 10 },
  chatHeading: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, paddingHorizontal: 20, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surfaceBase, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 6 },
  modalSubtitle: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: fonts.bodyRegular,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 16,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  cancelText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center" },
  expiredCard: { backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 14, marginBottom: 12 },
  expiredText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textSecondary, marginBottom: 10, textAlign: "center" },
  cancelButton: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.error, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  cancelButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.error },
});