import { useCallback, useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Image, ActivityIndicator, StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { IconArrowLeft, IconCamera, IconX, IconAlertTriangle } from "@tabler/icons-react-native";
import { supabase } from "../lib/supabase";
import { getSignedEvidenceUrl } from "../lib/signedUrl";
import { EvidenceViewerModal } from "./EvidenceViewerModal";
import { AlertDialog } from "./AlertDialog";
import { useAlertDialog } from "../lib/useAlertDialog";
import { colors, fonts } from "../theme";

const DISPUTABLE_STATUSES = ["accepted", "purchased", "delivered"];
const MAX_PHOTOS = 3;

interface ErrandRow {
  id: string;
  requester_id: string;
  scout_id: string | null;
  item_description: string;
  status: string;
}

interface DisputeRow {
  id: string;
  reason: string;
  status: "open" | "resolved";
  resolution: string | null;
  evidence_photo_urls: string[] | null;
}

export function DisputeScreen({ errandBasePath }: { errandBasePath: string }) {
  const insets = useSafeAreaInsets();
  const { errandId } = useLocalSearchParams<{ errandId: string }>();

  const [errand, setErrand] = useState<ErrandRow | null>(null);
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  const { showAlert, alertDialogProps } = useAlertDialog();

  const loadData = useCallback(async () => {
    if (!errandId) return;
    setLoading(true);

    const [{ data: errandRow }, { data: disputeRow }] = await Promise.all([
      supabase.from("errands").select("id, requester_id, scout_id, item_description, status").eq("id", errandId).single(),
      supabase
        .from("disputes")
        .select("id, reason, status, resolution, evidence_photo_urls")
        .eq("errand_id", errandId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setErrand(errandRow ?? null);
    setDispute(disputeRow ?? null);
    setLoading(false);
  }, [errandId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function handleAddPhoto() {
    if (photos.length >= MAX_PHOTOS) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Photo access needed", "Enable photo library access in Settings to attach evidence.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setPhotos((current) => [...current, result.assets[0].uri]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  async function handleViewEvidence(path: string) {
    setViewerVisible(true);
    setViewerLoading(true);
    const url = await getSignedEvidenceUrl("dispute-evidence", path);
    setViewerUrl(url);
    setViewerLoading(false);
  }

  async function handleSubmit() {
    if (!errand || !errandId) return;
    if (!reason.trim()) {
      setErrorMessage("Describe what went wrong.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      const uploadedPaths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const response = await fetch(photos[i]);
        const arrayBuffer = await response.arrayBuffer();
        const path = `${errandId}/${Date.now()}-${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("dispute-evidence")
          .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw new Error(`[storage] ${uploadError.message}`);
        uploadedPaths.push(path);
      }

      const { error: insertError } = await supabase.from("disputes").insert({
        errand_id: errandId,
        opened_by: user.id,
        reason: reason.trim(),
        status: "open",
        evidence_photo_urls: uploadedPaths.length > 0 ? uploadedPaths : null,
      });
      if (insertError) throw new Error(insertError.message);

      // Moves the errand out of its normal flow — pauses any pending
      // fund release until an admin resolves it (spec Section 10).
      const { error: statusError } = await supabase
        .from("errands")
        .update({ status: "disputed" })
        .eq("id", errandId);
      if (statusError) throw new Error(statusError.message);

      await supabase.from("chat_messages").insert({
        errand_id: errandId,
        sender_id: user.id,
        message_text: `Opened a dispute: ${reason.trim()}`,
      });

      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't submit dispute. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !errand) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const canFile = !dispute && DISPUTABLE_STATUSES.includes(errand.status);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable style={styles.header} onPress={() => router.back()}>
        <IconArrowLeft size={22} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={styles.headerTitle}>{dispute ? "Dispute status" : "Report an issue"}</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.itemLabel}>{errand.item_description}</Text>

        {dispute ? (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <IconAlertTriangle size={16} color={dispute.status === "open" ? colors.warning : colors.success} strokeWidth={1.75} />
              <Text style={styles.statusText}>
                {dispute.status === "open" ? "Under review" : "Resolved"}
              </Text>
            </View>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{dispute.reason}</Text>

            {dispute.resolution && (
              <>
                <Text style={styles.reasonLabel}>Outcome</Text>
                <Text style={styles.reasonText}>{dispute.resolution.replace(/_/g, " ")}</Text>
              </>
            )}

            {dispute.evidence_photo_urls && dispute.evidence_photo_urls.length > 0 && (
              <>
                <Text style={styles.reasonLabel}>Evidence submitted</Text>
                <View style={styles.thumbRow}>
                  {dispute.evidence_photo_urls.map((path) => (
                    <Pressable key={path} onPress={() => handleViewEvidence(path)}>
                      <View style={styles.thumbPlaceholder}>
                        <IconCamera size={18} color={colors.textMuted} strokeWidth={1.75} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.noteText}>
              Our team aims to review disputes within 24 hours.
            </Text>
          </View>
        ) : canFile ? (
          <>
            <Text style={styles.label}>What went wrong?</Text>
            <TextInput
              style={styles.input}
              placeholder="Describe the issue in detail"
              placeholderTextColor={colors.textSecondary + "80"}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={5}
            />

            <Text style={styles.label}>Evidence (optional)</Text>
            <View style={styles.thumbRow}>
              {photos.map((uri, index) => (
                <View key={uri} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumbImage} />
                  <Pressable style={styles.removeThumbButton} onPress={() => handleRemovePhoto(index)}>
                    <IconX size={12} color={colors.textPrimary} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <IconCamera size={20} color={colors.textMuted} strokeWidth={1.75} />
                </Pressable>
              )}
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.deep} />
              ) : (
                <Text style={styles.submitButtonText}>Submit dispute</Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              This errand isn't in a state that can be disputed right now.
            </Text>
          </View>
        )}
      </ScrollView>

      <EvidenceViewerModal
        visible={viewerVisible}
        imageUrl={viewerUrl}
        loading={viewerLoading}
        onClose={() => { setViewerVisible(false); setViewerUrl(null); }}
      />

      <AlertDialog {...alertDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, paddingHorizontal: 20 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.textPrimary },
  content: { paddingBottom: 60 },
  itemLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 18 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceRaised, color: colors.textPrimary, fontFamily: fonts.bodyRegular,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, minHeight: 110,
    textAlignVertical: "top", marginBottom: 20,
  },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  thumbWrapper: { position: "relative" },
  thumbImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.surfaceRaised },
  thumbPlaceholder: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: colors.surfaceRaised,
    alignItems: "center", justifyContent: "center",
  },
  removeThumbButton: {
    position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.error, alignItems: "center", justifyContent: "center",
  },
  addPhotoButton: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5, borderColor: colors.borderSubtle, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  errorText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.error, marginBottom: 14 },
  submitButton: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  submitButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.deep },
  statusCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  reasonLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginBottom: 4, marginTop: 10 },
  reasonText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary, lineHeight: 19 },
  noteText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 16, textAlign: "center" },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center" },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
});
