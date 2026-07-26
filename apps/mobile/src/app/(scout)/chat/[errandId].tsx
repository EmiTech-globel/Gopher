import { StyleSheet } from "react-native";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ChatThread } from "../../../components/ChatThread";
import { colors } from "../../../theme";

export default function ScoutChatScreen() {
  const { errandId } = useLocalSearchParams<{ errandId: string }>();
  if (!errandId) return null;

  return (
    <View style={styles.container}>
      <ChatThread errandId={errandId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, paddingTop: 64 },
});