import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { IconArrowLeft, IconCamera, IconAlertCircle } from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

export default function RequestFundsScreen() {
  const insets = useSafeAreaInsets();
  const { errandId } = useLocalSearchParams<{ errandId: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewingPhoto, setReviewingPhoto] = useState(false);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhotoUri(photo.uri);
    setShowCamera(false);
    setReviewingPhoto(true);
  }

  async function handleSubmit() {
    if (!errandId) return;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage("Enter a valid amount.");
      return;
    }
    if (!photoUri) {
      setErrorMessage("Attach a photo showing the price before submitting.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      const response = await fetch(photoUri);
      const arrayBuffer = await response.arrayBuffer();
      const path = `${errandId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("balance-request-evidence")
        .upload(path, arrayBuffer, { upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw new Error(`[storage] ${uploadError.message}`);

      const { error: insertError } = await supabase.from("balance_requests").insert({
        errand_id: errandId,
        requested_amount: parsedAmount,
        reason: reason.trim() || null,
        evidence_photo_url: path,
        status: "pending",
      });
      if (insertError) throw new Error(`[balance_requests] ${insertError.message}`);

      await supabase.from("chat_messages").insert({
        errand_id: errandId,
        sender_id: user.id,
        message_text: `Requested an additional ₦${parsedAmount.toLocaleString()}${
          reason.trim() ? ` — ${reason.trim()}` : ""
        }`,
      });

      router.back();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.permissionText}>Camera access is needed to capture price evidence.</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.saveButtonText}>Grant camera access</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBase }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom + 20, 30) }}>
          <Pressable style={styles.saveButton} onPress={handleCapture}>
            <IconCamera size={16} color={colors.textPrimary} strokeWidth={2} />
            <Text style={styles.saveButtonText}>Capture photo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (reviewingPhoto && photoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBase }}>
        <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="contain" />
        <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom + 20, 30) }}>
          <Pressable style={styles.saveButton} onPress={() => setReviewingPhoto(false)}>
            <Text style={styles.saveButtonText}>Use this photo</Text>
          </Pressable>
          <Pressable
            style={{ marginTop: 10, alignItems: "center" }}
            onPress={() => { setPhotoUri(null); setShowCamera(true); setReviewingPhoto(false); }}
          >
            <Text style={{ fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary }}>Retake</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <IconArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={styles.headerTitle}>Request additional funds</Text>
      </Pressable>

      <View style={styles.infoBanner}>
        <IconAlertCircle size={16} color={colors.warning} strokeWidth={1.75} />
        <Text style={styles.infoBannerText}>
          Don't buy yet — wait for the requester to approve before proceeding.
        </Text>
      </View>

      <Text style={styles.label}>Additional amount needed</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="₦0"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Reason (optional)</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="e.g. price went up, item wasn't available"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
      />

      <Text style={styles.label}>Evidence photo</Text>
      <Pressable style={styles.photoBox} onPress={() => setShowCamera(true)}>
        {photoUri ? (
          <Text style={styles.photoBoxText}>Photo captured — tap to retake</Text>
        ) : (
          <>
            <IconCamera size={22} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.photoBoxText}>Tap to take a photo of the price</Text>
          </>
        )}
      </Pressable>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>Send request</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, paddingHorizontal: 20 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center", padding: 24 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary },
  infoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(224,169,106,0.14)", borderRadius: 12, padding: 12, marginBottom: 20,
  },
  infoBannerText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.warning, flex: 1 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceRaised, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.textPrimary, fontFamily: fonts.bodyRegular, fontSize: 14, marginBottom: 18,
  },
  photoBox: {
    backgroundColor: colors.surfaceRaised, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.surfaceElevated, borderStyle: "dashed", height: 100,
    alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
  },
  photoBoxText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, textAlign: "center", paddingHorizontal: 20 },
  errorText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.error, marginBottom: 12 },
  permissionText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary, textAlign: "center", marginBottom: 16 },
  permissionButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  saveButton: {
    flexDirection: "row", gap: 8, backgroundColor: colors.primary, borderRadius: 12,
    height: 48, alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  saveButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
});