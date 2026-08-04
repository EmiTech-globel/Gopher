import { Modal, View, Image, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconX } from "@tabler/icons-react-native";
import { colors } from "../theme";

interface EvidenceViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  loading?: boolean;
  onClose: () => void;
}

export function EvidenceViewerModal({ visible, imageUrl, loading, onClose }: EvidenceViewerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={12}
        >
          <IconX size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#000000EE", alignItems: "center", justifyContent: "center" },
  closeButton: {
    position: "absolute", right: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  image: { width: "100%", height: "80%" },
});
