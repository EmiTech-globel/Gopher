import { useRef, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts } from "../../theme";

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
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: colors.accent,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textPrimary,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  camera: {
    width: 280,
    height: 360,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  previewBox: {
    width: 280,
    height: 360,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    marginBottom: 24,
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  link: {
    color: colors.accent,
    opacity: 0.7,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
  },
});