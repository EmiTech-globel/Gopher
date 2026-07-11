import { useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PENDING_SELFIE_URI_KEY = "gopher.pendingSelfieUri";

export default function SelfieCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) setCapturedUri(photo.uri);
  }

  async function handleConfirm() {
    if (!capturedUri) return;
    await AsyncStorage.setItem(PENDING_SELFIE_URI_KEY, capturedUri);
    router.push("/id-capture");
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
        <Text style={styles.title}>Look good?</Text>
        <Image source={{ uri: capturedUri }} style={styles.previewBox} resizeMode="cover" />
        <Pressable style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Use this photo</Text>
        </Pressable>
        <Pressable onPress={() => setCapturedUri(null)}>
          <Text style={styles.link}>Retake</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a selfie</Text>
      <Text style={styles.subtitle}>Make sure your face is clearly visible and well lit.</Text>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />
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
  camera: { width: 280, height: 360, borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  previewBox: { width: 280, height: 360, borderRadius: 16, backgroundColor: "#2A1533", marginBottom: 24 },
  text: { color: "#FFFFFF", textAlign: "center", fontSize: 15, lineHeight: 21 },
  button: { backgroundColor: "#532B59", paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, marginBottom: 16 },
  buttonText: { color: "#D7AEAD", fontSize: 16, fontWeight: "600" },
  link: { color: "#D7AEAD", opacity: 0.7, fontSize: 14 },
});
