import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput,
  ActivityIndicator, Modal, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { IconCheck, IconStarFilled, IconStar, IconAlertTriangle } from "@tabler/icons-react-native";
import { supabase } from "../../../../lib/supabase";
import { colors, fonts } from "../../../../theme";

export default function DeliveryConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const errandId = typeof id === "string" ? id : null;
  const [scoutId, setScoutId] = useState<string | null>(null);
  const [scoutName, setScoutName] = useState("your Scout");
  const [itemDescription, setItemDescription] = useState("");
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueReason, setIssueReason] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  useEffect(() => {
    async function load() {
      if (!errandId) return;
      const { data: errand } = await supabase
        .from("errands")
        .select("scout_id, item_description")
        .eq("id", errandId)
        .single();

      if (errand) {
        setItemDescription(errand.item_description);
        if (errand.scout_id) {
          setScoutId(errand.scout_id);
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("full_name")
            .eq("id", errand.scout_id)
            .single();
          if (profile?.full_name) setScoutName(profile.full_name);
        }
      }
      setLoading(false);
    }
    load();
  }, [errandId]);

  async function handleConfirm() {
    if (!errandId || !scoutId) return;
    if (stars === 0) {
      Alert.alert("Add a rating", "Please rate your Scout before confirming.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from("errands")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", errandId);

    if (updateError) {
      setSubmitting(false);
      Alert.alert("Couldn't confirm delivery", updateError.message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setSubmitting(false);
      Alert.alert("Couldn't confirm delivery", "Please sign in and try again.");
      return;
    }

    const { error: ratingError } = await supabase.from("ratings").insert({
      errand_id: errandId,
      rated_by: user.id,
      rated_user_id: scoutId,
      stars,
      note: note.trim() || null,
    });

    setSubmitting(false);
    if (ratingError) {
      Alert.alert("Delivery confirmed", `But your rating couldn't be saved: ${ratingError.message}`);
    }
    router.replace("/(user)/home");
  }

  async function handleSubmitIssue() {
    if (!errandId || !issueReason.trim()) {
      Alert.alert("Add a reason", "Please describe the issue.");
      return;
    }
    setSubmittingIssue(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      setSubmittingIssue(false);
      Alert.alert("Couldn't submit", "Please sign in and try again.");
      return;
    }

    const { error } = await supabase.from("disputes").insert({
      errand_id: errandId, opened_by: user.id, reason: issueReason.trim(), status: "open",
    });
    if (!error) {
      // Pauses any pending fund release on this errand until an admin
      // resolves it (spec Section 10) — matches the dedicated dispute
      // screen's behavior so both entry points leave the errand in the
      // same state.
      await supabase.from("errands").update({ status: "disputed" }).eq("id", errandId);
    }
    setSubmittingIssue(false);
    if (error) { Alert.alert("Couldn't submit", error.message); return; }
    setIssueModalVisible(false);
    Alert.alert("Issue reported", "Our team will review this within 24 hours.");
    router.replace("/(user)/home");
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const initials = scoutName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconCircle}>
        <IconCheck size={28} color={colors.success} strokeWidth={2.5} />
      </View>
      <Text style={styles.title}>Errand delivered</Text>
      <Text style={styles.subtitle}>Confirm to release payment to {scoutName}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryAvatar}>
          <Text style={styles.summaryAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryItem} numberOfLines={1}>{itemDescription}</Text>
          <Text style={styles.summaryMeta}>Delivered just now</Text>
        </View>
      </View>

      <Text style={styles.promptText}>How was {scoutName}'s errand?</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setStars(value)} style={styles.starButton}>
            {value <= stars ? (
              <IconStarFilled size={30} color={colors.warning} />
            ) : (
              <IconStar size={30} color={colors.textMuted} strokeWidth={1.5} />
            )}
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Leave a note (optional)"
        placeholderTextColor={colors.textSecondary + "80"}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={2}
      />

      <Pressable style={styles.primaryButton} onPress={handleConfirm} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.deep} />
        ) : (
          <>
            <IconCheck size={17} color={colors.deep} strokeWidth={2.25} />
            <Text style={styles.primaryButtonText}>Confirm and release payment</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.issueButton} onPress={() => setIssueModalVisible(true)}>
        <IconAlertTriangle size={15} color={colors.error} strokeWidth={1.75} />
        <Text style={styles.issueButtonText}>Something's wrong, report an issue</Text>
      </Pressable>

      <Modal visible={issueModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Report an issue</Text>
            <Text style={styles.modalSubtitle}>
              This opens a dispute instead of confirming delivery. Our team reviews disputes within 24 hours.
            </Text>
            <TextInput
              style={[styles.noteInput, styles.issueInput]}
              placeholder="Describe what went wrong"
              placeholderTextColor={colors.textSecondary + "80"}
              value={issueReason}
              onChangeText={setIssueReason}
              multiline
            />
            <Pressable style={styles.primaryButton} onPress={handleSubmitIssue} disabled={submittingIssue}>
              {submittingIssue ? <ActivityIndicator color={colors.deep} /> : <Text style={styles.primaryButtonText}>Submit report</Text>}
            </Pressable>
            <Pressable onPress={() => setIssueModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 80, alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#16A34A22", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 4, textAlign: "center" },
  subtitle: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginBottom: 20, textAlign: "center" },
  summaryRow: {
    flexDirection: "row", alignItems: "center", width: "100%", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, padding: 12, marginBottom: 18,
  },
  summaryAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.avatarScout, alignItems: "center", justifyContent: "center", marginRight: 10 },
  summaryAvatarText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accentLight },
  summaryItem: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
  summaryMeta: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  promptText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary, marginBottom: 10 },
  starsRow: { flexDirection: "row", marginBottom: 20 },
  starButton: { marginHorizontal: 4 },
  noteInput: {
    width: "100%", backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: fonts.bodyRegular,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 13, minHeight: 70,
    textAlignVertical: "top", marginBottom: 20,
  },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%",
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 15, marginBottom: 10,
  },
  primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.deep, marginLeft: 8 },
  issueButton: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  issueButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.error, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surfaceBase, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  modalTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginBottom: 6 },
  modalSubtitle: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  issueInput: { minHeight: 100 },
  cancelText: { fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});