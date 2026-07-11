import { useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { PENDING_SELFIE_URI_KEY } from "./selfie-capture";
import { PENDING_MATRIC_KEY } from "./scout-registration";
import { ErrorText } from "../../components/auth";
import { createClient } from "@supabase/supabase-js";

async function uploadPhoto(
  uri: string,
  userId: string,
  filename: string,
  accessToken: string
) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${userId}/${filename}`;

  const scopedClient = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  await scopedClient.storage.from("scout-verification").remove([path]);

  const { error } = await scopedClient.storage
    .from("scout-verification")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });

  if (error) throw new Error(`[storage:${filename}] ${error.message}`);
  return path;
}

export default function IdCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  // A ref, not state — state updates are async/batched and won't block
  // a second tap that lands before the re-render. This is what actually
  // caused the double-invocation bug (two uploads to the same path, the
  // second becoming an UPDATE with no matching RLS policy).
  const submittingRef = useRef(false);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) setCapturedUri(photo.uri);
  }

  async function handleConfirm() {
    if (!capturedUri || submittingRef.current) return;
    submittingRef.current = true;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMessage("Your session expired. Please log in and try again.");
        return;
      }

      // TEMP DEBUG — remove after this test
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();
     
      const selfieUri = await AsyncStorage.getItem(PENDING_SELFIE_URI_KEY);
      const matricNumber = await AsyncStorage.getItem(PENDING_MATRIC_KEY);

      if (!selfieUri || !matricNumber) {
        setErrorMessage("Missing registration details. Please start over.");
        return;
      }

      const userId = session.user.id;
      const selfiePath = await uploadPhoto(selfieUri, userId, "selfie.jpg", session.access_token);
      const idPath = await uploadPhoto(capturedUri, userId, "id.jpg", session.access_token);

      const { error: insertError } = await supabase.from("scouts").insert({
        profile_id: userId,
        matric_number: matricNumber,
        selfie_url: selfiePath,
        id_photo_url: idPath,
      });

      if (insertError) throw new Error(`[scouts insert] ${insertError.message}`);

      await AsyncStorage.multiRemove([PENDING_SELFIE_URI_KEY, PENDING_MATRIC_KEY]);
      router.replace("/verification-pending");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Camera access is required to verify your identity. Gallery uploads
          aren't accepted for this step, per platform trust and safety rules.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Clear and readable?</Text>
        <Image source={{ uri: capturedUri }} style={styles.previewBox} resizeMode="cover" />
        <ErrorText message={errorMessage} />
        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Use this photo"}</Text>
        </Pressable>
        {!submitting && (
          <Pressable onPress={() => setCapturedUri(null)}>
            <Text style={styles.link}>Retake</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture your student ID</Text>
      <Text style={styles.subtitle}>
        Hold your ID flat and make sure your name and matric number are readable.
      </Text>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Pressable style={styles.button} onPress={handleCapture}>
        <Text style={styles.buttonText}>Capture</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A0E22", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#D7AEAD", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#FFFFFF", opacity: 0.7, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  camera: { width: 320, height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  previewBox: { width: 320, height: 220, borderRadius: 16, backgroundColor: "#2A1533", marginBottom: 24 },
  text: { color: "#FFFFFF", textAlign: "center", fontSize: 15, lineHeight: 21 },
  button: { backgroundColor: "#532B59", paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#D7AEAD", fontSize: 16, fontWeight: "600" },
  link: { color: "#D7AEAD", opacity: 0.7, fontSize: 14 },
});
