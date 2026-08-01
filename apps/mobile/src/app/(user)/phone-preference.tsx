import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";

export default function PhonePreferenceScreen() {
  const insets = useSafeAreaInsets();
  const [revealByDefault, setRevealByDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("reveal_phone_by_default")
        .eq("id", user.id)
        .single();
      setRevealByDefault(data?.reveal_phone_by_default ?? false);
      setLoading(false);
    }
    load();
  }, []);

  async function handleToggle(value: boolean) {
    setRevealByDefault(value);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ reveal_phone_by_default: value }).eq("id", user.id);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Phone reveal preference</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>Reveal my phone number by default</Text>
          <Text style={styles.rowSubtext}>
            When a Scout accepts your errand, your phone number becomes visible to them automatically instead of needing a manual reveal in chat.
          </Text>
        </View>
        <Switch
          value={revealByDefault}
          onValueChange={handleToggle}
          disabled={saving}
          trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
          thumbColor={colors.textPrimary}
        />
      </View>

      <Text style={styles.noteText}>
        This sets your default preference only. You can still choose to reveal or withhold your number manually on a per-errand basis in chat.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase, paddingHorizontal: 20 },
  centeredContainer: { flex: 1, backgroundColor: colors.surfaceBase, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  card: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  rowContent: { flex: 1, marginRight: 16 },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 6 },
  rowSubtext: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  noteText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, opacity: 0.8, lineHeight: 16 },
});