import { Pressable, Text, View, StyleSheet } from "react-native";
import { IconChevronRight } from "@tabler/icons-react-native";
import { colors, fonts } from "../theme";

interface SettingsRowProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
}

export function SettingsRow({ icon: Icon, label, onPress, showDivider = true }: SettingsRowProps) {
  return (
    <Pressable style={[styles.row, showDivider && styles.rowDivider]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Icon size={17} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
});