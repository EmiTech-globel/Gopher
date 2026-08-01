import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconPlus, IconChevronRight, IconBell } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";
import { useUnreadCount } from "../../lib/useUnreadCount";

const ACTIVE_STATUSES = ["open", "accepted", "purchased", "delivered", "disputed"];

interface ErrandRow {
  id: string;
  item_description: string;
  status: string;
  created_at: string;
}

export default function UserHomeScreen() {
  const [fullName, setFullName] = useState<string | null>(null);
  const [activeErrand, setActiveErrand] = useState<ErrandRow | null>(null);
  const [history, setHistory] = useState<ErrandRow[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: profile }, { data: errands }] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
      supabase
        .from("errands")
        .select("id, item_description, status, created_at")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setFullName(profile?.full_name ?? null);
    // If avatar_url is a storage path, Supabase `getPublicUrl` is required
    // elsewhere; here assume stored value is already a public URL.
    setAvatarUrl(profile?.avatar_url ?? null);
    setActiveErrand(errands?.find((e) => ACTIVE_STATUSES.includes(e.status)) ?? null);
    setHistory((errands ?? []).filter((e) => !ACTIVE_STATUSES.includes(e.status)).slice(0, 5));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`open-errands-count:${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "errands" }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const firstName = fullName?.split(" ")[0] ?? "there";
  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  function statusHint(status: string) {
    switch (status) {
      case "open": return "Waiting for a Scout to accept";
      case "accepted": return "Scout is on it";
      case "purchased": return "Item purchased";
      case "delivered": return "On the way to you";
      case "disputed": return "Under review";
      default: return status;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingLabel}>Good {timeOfDay()}</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable style={styles.bellButton} onPress={() => router.push("/(user)/notifications")}>
            <IconBell size={18} color={colors.textTertiary} strokeWidth={1.75} />
            {useUnreadCount().count > 0 && <View style={styles.bellDot} />}
          </Pressable>
          <Pressable style={styles.avatarCircle} onPress={() => router.push("/edit-profile")}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImageSmall} />
            ) : (
              <Text style={styles.avatarInitial}>{initials}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <LinearGradient
        colors={[colors.primary, colors.deep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaCard}
      >
        <Text style={styles.ctaTitle}>Need something?</Text>
        <Text style={styles.ctaSubtitle}>Post an errand and a scout nearby will handle it</Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push("/(user)/post-errand")}>
          <IconPlus size={15} color={colors.deep} strokeWidth={2.5} />
          <Text style={styles.ctaButtonText}>Post an errand</Text>
        </Pressable>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Active errand</Text>
      {activeErrand ? (
        <Pressable style={styles.errandRow} onPress={() => router.push(`/(user)/errand/${activeErrand.id}`)}>
          <View style={styles.errandAvatar}>
            <Text style={styles.errandAvatarText}>{activeErrand.item_description.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.errandRowContent}>
            <Text style={styles.errandItem} numberOfLines={1}>{activeErrand.item_description}</Text>
            <Text style={styles.errandStatus}>{statusHint(activeErrand.status)}</Text>
          </View>
          <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active errand right now.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent errands</Text>
      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Your completed errands will show up here.</Text>
        </View>
      ) : (
        history.map((errand) => (
          <View key={errand.id} style={styles.historyRow}>
            <Text style={styles.historyItem} numberOfLines={1}>{errand.item_description}</Text>
            <Text style={styles.historyStatus}>{errand.status === "confirmed" ? "Delivered" : "Cancelled"}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 140 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  greetingLabel: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted },
  greetingName: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.accentLight },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  bellDot: { position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surfaceRaised },
  bellButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
    alignItems: "center", justifyContent: "center", marginRight: 10,
    position: "relative",
  },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accentLight },
  avatarImageSmall: { width: 38, height: 38, borderRadius: 19 },
  ctaCard: { borderRadius: 18, padding: 18, marginBottom: 20 },
  ctaTitle: { fontFamily: fonts.headingMedium, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  ctaSubtitle: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.accent, marginBottom: 14 },
  ctaButton: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16,
  },
  ctaButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.deep, marginLeft: 6 },
  sectionTitle: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, marginBottom: 10 },
  errandRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 14, padding: 12, marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
  },
  errandAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.avatarScout, alignItems: "center", justifyContent: "center", marginRight: 10 },
  errandAvatarText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.accentLight },
  errandRowContent: { flex: 1 },
  errandItem: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
  errandStatus: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 18, alignItems: "center", marginBottom: 20 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  historyItem: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textTertiary, flex: 1, marginRight: 8 },
  historyStatus: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.success },
});
