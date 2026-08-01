import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { colors, fonts } from "../theme";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000090", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 18, padding: 22, width: "100%" },
  title: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary, marginBottom: 8, textAlign: "center" },
  message: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: "center", marginBottom: 20 },
  buttonRow: { flexDirection: "row" },
  cancelButton: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginRight: 8 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
  confirmButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  confirmText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});