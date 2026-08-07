import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconSearch, IconChevronRight, IconBell, IconShieldStar, IconStarFilled } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";
import { useUnreadCount } from "../../../lib/useUnreadCount";

const ACTIVE_STATUSES = ["accepted", "purchased", "delivered", "disputed"];
const CHARGES_FEE_RATE = 0.18;

interface ErrandRow {
  id: string;
  item_description: string;
  status: string;
  delivery_fee: number;
  confirmed_at: string | null;
  created_at: string;
}

interface ScoutProfile {
  full_name: string;
  trust_tier: "new" | "trusted";
  avatar_url: string | null;
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function ScoutHomeScreen() {
  const [profile, setProfile] = useState<ScoutProfile | null>(null);
  const [activeErrands, setActiveErrands] = useState<ErrandRow[]>([]);
  const [commissionThisWeek, setCommissionThisWeek] = useState(0);
  const [openErrandCount, setOpenErrandCount] = useState(0);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const { count: unreadCount } = useUnreadCount();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekStart = getStartOfWeek().toISOString();

    // public_scouts is a live-computed view (see migration 00006) — no
    // counters to drift out of sync, it recalculates from source tables
    // on every query.
    const [{ data: profileRow }, { data: statsRow }, { data: errands }, { count: openCount }] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
      supabase.from("public_scouts").select("trust_tier, completed_errands_count, rating_avg").eq("profile_id", user.id).single(),
      supabase
        .from("errands")
        .select("id, item_description, status, delivery_fee, confirmed_at, created_at")
        .eq("scout_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("errands").select("id", { count: "exact", head: true }).eq("status", "open").neq("requester_id", user.id),
    ]);

    setProfile({
      full_name: profileRow?.full_name ?? "Scout",
      avatar_url: profileRow?.avatar_url ?? null,
      trust_tier: statsRow?.trust_tier ?? "new",
    });

    setActiveErrands((errands ?? []).filter((e) => ACTIVE_STATUSES.includes(e.status)));
    setOpenErrandCount(openCount ?? 0);
    setCompletedCount(statsRow?.completed_errands_count ?? 0);
    setRatingAvg(statsRow?.rating_avg ?? null);

    const weekCommission = (errands ?? [])
      .filter((e) => e.status === "confirmed" && e.confirmed_at && e.confirmed_at >= weekStart)
      .reduce((sum, e) => sum + e.delivery_fee * (1 - CHARGES_FEE_RATE), 0);
    setCommissionThisWeek(weekCommission);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Live push while the screen is open — the view has nothing cached, so
  // any change to source tables just needs a re-fetch to reflect.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      channel = supabase
        .channel(`scout-home-live:${data.user.id}:${Math.random()}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "errands", filter: `scout_id=eq.${data.user.id}` },
          () => loadData()
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ratings", filter: `rated_user_id=eq.${data.user.id}` },
          () => loadData()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadData]);

  if (!profile) return <View style={styles.container} />;

  const firstName = profile.full_name.split(" ")[0];
  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const trustLabel = profile.trust_tier === "trusted" ? "Trusted scout" : "New scout";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingLabel}>Welcome back</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable style={styles.bellButton} onPress={() => router.push("/(scout)/notification")}>
            <IconBell size={18} color={colors.textTertiary} strokeWidth={1.75} />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </Pressable>
          <Pressable style={styles.avatarCircle} onPress={() => router.push("/edit-profile")}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImageSmall} />
            ) : (
              <Text style={styles.avatarInitial}>{initials}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.trustPill}>
        <IconShieldStar size={13} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.trustPillText}>
          {trustLabel} · {completedCount} errands
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Commission this week</Text>
          <Text style={styles.statValue}>₦{commissionThisWeek.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            <IconStarFilled size={15} color={colors.warning} />
            <Text style={styles.statValue}>{ratingAvg != null ? ratingAvg.toFixed(1) : "New"}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active errand{activeErrands.length === 1 ? "" : "s"}</Text>
      {activeErrands.length > 0 ? (
        <View style={styles.errandList}>
          {activeErrands.map((errand, index) => (
            <Pressable
              key={errand.id}
              style={[styles.errandRow, index < activeErrands.length - 1 && styles.errandRowStacked]}
              onPress={() => router.push(`/(scout)/errand/${errand.id}`)}
            >
              <View style={styles.errandAvatar}>
                <Text style={styles.errandAvatarText}>{errand.item_description.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.errandRowContent}>
                <Text style={styles.errandItem} numberOfLines={1}>{errand.item_description}</Text>
                <Text style={styles.errandStatus}>{errand.status === "delivered" ? "Delivered, awaiting confirmation" : "In progress"}</Text>
              </View>
              <IconChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active errand right now.</Text>
        </View>
      )}

      <LinearGradient
        colors={[colors.primary, colors.deep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaCard}
      >
        <Text style={styles.ctaTitle}>
          {openErrandCount} open errand{openErrandCount === 1 ? "" : "s"} nearby
        </Text>
        <Text style={styles.ctaSubtitle}>Earn while you're free</Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push("/(scout)/browse")}>
          <IconSearch size={15} color={colors.deep} strokeWidth={2.5} />
          <Text style={styles.ctaButtonText}>Browse errands</Text>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 140 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
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
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.avatarScout, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accentLight },
  avatarImageSmall: { width: 38, height: 38, borderRadius: 19 },
  trustPill: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    backgroundColor: colors.deep, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, marginBottom: 16,
  },
  trustPillText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.accent, marginLeft: 5 },
  statsRow: { flexDirection: "row", marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 14, marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
  },
  statLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.textPrimary, marginLeft: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, marginBottom: 10 },
  errandList: { marginBottom: 20 },
  errandRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 14, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
  },
  errandRowStacked: { marginBottom: 10 },
  errandAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 10 },
  errandAvatarText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.deep },
  errandRowContent: { flex: 1 },
  errandItem: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
  errandStatus: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 18, alignItems: "center", marginBottom: 20 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
  ctaCard: { borderRadius: 18, padding: 18, alignItems: "center" },
  ctaTitle: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  ctaSubtitle: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.accent, marginBottom: 12 },
  ctaButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.accent,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 18,
  },
  ctaButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.deep, marginLeft: 6 },
});