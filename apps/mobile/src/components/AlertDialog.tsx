import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { colors, fonts } from "../theme";

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  variant?: "default" | "error";
  onClose: () => void;
}

/**
 * Single-button themed replacement for React Native's Alert.alert.
 * Alert.alert renders the OS's native dialog (plain gray, light-mode by
 * default on most Android skins) which clashes hard with Gopher's dark
 * plum theme — this matches ConfirmDialog's visual language instead so
 * every in-app message looks like part of the same product.
 */
export function AlertDialog({
  visible, title, message, buttonLabel = "OK", variant = "default", onClose,
}: AlertDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, variant === "error" && styles.titleError]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000090", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 18, padding: 22, width: "100%" },
  title: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary, marginBottom: 8, textAlign: "center" },
  titleError: { color: colors.error },
  message: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  buttonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});
