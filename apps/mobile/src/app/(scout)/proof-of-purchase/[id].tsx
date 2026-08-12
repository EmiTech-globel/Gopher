import { useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { ErrorText } from "../../../components/auth";
import { colors, fonts } from "../../../theme";

type CaptureStep = "item" | "receipt";

export default function ProofOfPurchaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<CaptureStep>("item");
  const [itemPhotoUri, setItemPhotoUri] = useState<string | null>(null);
  const [receiptPhotoUri, setReceiptPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (!photo?.uri) return;
    if (step === "item") setItemPhotoUri(photo.uri);
    else setReceiptPhotoUri(photo.uri);
  }

  function handleRetake() {
    if (step === "item") setItemPhotoUri(null);
    else setReceiptPhotoUri(null);
  }

  function handleContinueToReceipt() {
    setStep("receipt");
  }

  async function handleSubmit() {
    if (!id || !itemPhotoUri) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in again.");

      async function uploadPhoto(uri: string, filename: string) {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const path = `${id}/${filename}`;

        // Makes a retry after a partial failure (e.g. item.jpg
        // uploaded fine, receipt.jpg or the status update afterward
        // failed) actually work instead of hitting "already exists"
        // on the item.jpg re-upload — this screen's own error
        // handling explicitly allows exactly that retry (stays
        // mounted, re-enables Submit).
        const { error: removeError } = await supabase.storage.from("proof-of-purchase").remove([path]);
        if (removeError && !/not.?found/i.test(removeError.message)) {
          throw new Error(`[storage:${filename} cleanup] ${removeError.message}`);
        }

        const { error } = await supabase.storage
          .from("proof-of-purchase")
          .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error(`[storage:${filename}] ${error.message}`);
        return path;
      }

      await uploadPhoto(itemPhotoUri, "item.jpg");
      if (receiptPhotoUri) await uploadPhoto(receiptPhotoUri, "receipt.jpg");

      const { error: updateError } = await supabase
        .from("errands")
        .update({ status: "purchased", purchased_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) throw new Error(updateError.message);

      router.replace(`/(scout)/errand/${id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Camera access is required for proof of purchase. Gallery uploads aren't accepted for this step.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  const currentUri = step === "item" ? itemPhotoUri : receiptPhotoUri;

  if (currentUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{step === "item" ? "Item captured" : "Receipt captured"}</Text>
        <Image source={{ uri: currentUri }} style={styles.previewBox} resizeMode="cover" />
        <ErrorText message={errorMessage} />

        {step === "item" ? (
          <Pressable style={styles.button} onPress={handleContinueToReceipt}>
            <Text style={styles.buttonText}>Continue to receipt</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Submit and continue"}</Text>
          </Pressable>
        )}

        {!submitting && (
          <Pressable onPress={handleRetake}>
            <Text style={styles.link}>Retake</Text>
          </Pressable>
        )}

        {step === "item" && !submitting && (
          <Pressable onPress={handleSubmit}>
            <Text style={styles.link}>Skip receipt (item photo only)</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{step === "item" ? "Capture the item" : "Capture the receipt"}</Text>
      <Text style={styles.subtitle}>
        {step === "item"
          ? "Take a clear photo of the item you purchased."
          : "If available, capture the receipt as proof of purchase."}
      </Text>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Pressable style={styles.button} onPress={handleCapture}>
        <Text style={styles.buttonText}>Capture</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  title: { fontSize: 22, fontFamily: fonts.headingBold, color: colors.accent, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textPrimary, opacity: 0.7, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  camera: { width: 300, height: 380, borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  previewBox: { width: 300, height: 380, borderRadius: 16, backgroundColor: colors.surfaceRaised, marginBottom: 24 },
  text: { color: colors.textPrimary, fontFamily: fonts.bodyRegular, textAlign: "center", fontSize: 15, lineHeight: 21 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.accent, fontSize: 16, fontFamily: fonts.bodySemiBold },
  link: { color: colors.accent, opacity: 0.7, fontFamily: fonts.bodyRegular, fontSize: 14, marginBottom: 8 },
});