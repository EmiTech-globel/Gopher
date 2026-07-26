import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconBell, IconCalendar, IconFileText } from "@tabler/icons-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { useUnreadCount } from "../../lib/useUnreadCount";
import { colors, fonts } from "../../theme";

const CHARGES_FEE_RATE = 0.18;

interface CompletedErrand {
  id: string;
  item_description: string;
  delivery_fee: number;
  confirmed_at: string | null;
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getNextSaturday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  return saturday;
}

export default function EarningsScreen() {
  const [thisWeekErrands, setThisWeekErrands] = useState<CompletedErrand[]>([]);
  const [lifetimeCommission, setLifetimeCommission] = useState(0);
  const [lifetimeErrandCount, setLifetimeErrandCount] = useState(0);
  const { count: unreadCount } = useUnreadCount();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

      const weekStart = getStartOfWeek().toISOString();
      const { data: confirmedErrands } = await supabase
      .from("errands")
      .select("id, item_description, delivery_fee, confirmed_at")
      .eq("scout_id", user.id)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false });

    const allConfirmed = confirmedErrands ?? [];
      // filter out any records without a confirmed_at and those before week start
      const weekConfirmed = allConfirmed.filter((e) => e.confirmed_at && e.confirmed_at >= weekStart) as CompletedErrand[];

      setThisWeekErrands(weekConfirmed);
    setLifetimeErrandCount(allConfirmed.length);
    setLifetimeCommission(allConfirmed.reduce((sum, e) => sum + e.delivery_fee * (1 - CHARGES_FEE_RATE), 0));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const weekCommission = thisWeekErrands.reduce((sum, e) => sum + e.delivery_fee * (1 - CHARGES_FEE_RATE), 0);
  const nextSaturday = getNextSaturday();
  const payoutDateLabel = nextSaturday.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={thisWeekErrands}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Earnings</Text>
            <Pressable style={styles.bellButton} onPress={() => router.push("/(scout)/notifications")}>
              <IconBell size={17} color={colors.textTertiary} strokeWidth={1.75} />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </Pressable>
          </View>

          <LinearGradient
            colors={[colors.primary, colors.deep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>Commission this week</Text>
            <Text style={styles.heroValue}>₦{weekCommission.toLocaleString()}</Text>
            <View style={styles.payoutPill}>
              <IconCalendar size={12} color={colors.accentLight} strokeWidth={1.75} />
              <Text style={styles.payoutPillText}>Pays out {payoutDateLabel}</Text>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Completed this week</Text>
              <Text style={styles.statValue}>{thisWeekErrands.length}</Text>
              <Text style={styles.statSubtext}>errands</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Lifetime earned</Text>
              <Text style={styles.statValue}>₦{lifetimeCommission.toLocaleString()}</Text>
              <Text style={styles.statSubtext}>{lifetimeErrandCount} errands</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>This week's errands</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.errandRow}>
          <View>
            <Text style={styles.errandItem} numberOfLines={1}>{item.item_description}</Text>
            <Text style={styles.errandDate}>
              {item.confirmed_at ? new Date(item.confirmed_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : ""}
            </Text>
          </View>
          <Text style={styles.errandCommission}>+₦{(item.delivery_fee * (1 - CHARGES_FEE_RATE)).toLocaleString()}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No completed errands this week yet.</Text>
        </View>
      }
      ListFooterComponent={
        <Pressable style={styles.historyButton} onPress={() => router.push("/(scout)/payout-history")}>
          <IconFileText size={15} color={colors.textTertiary} strokeWidth={1.75} />
          <Text style={styles.historyButtonText}>View full payment history</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 140 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    marginBottom: 20, 
    color: colors.accentLight, 
  },
  bellButton: {
    position: "relative", width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle, alignItems: "center", justifyContent: "center",
  },
  bellDot: { position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surfaceBase },
  heroCard: { borderRadius: 18, padding: 20, marginBottom: 14, alignItems: "center" },
  heroLabel: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.accent, marginBottom: 6 },
  heroValue: { fontFamily: fonts.headingBold, fontSize: 30, color: colors.textPrimary, marginBottom: 10 },
  payoutPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  payoutPillText: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.accentLight, marginLeft: 5 },
  statsRow: { flexDirection: "row", marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 12, marginRight: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle },
  statLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.textPrimary },
  statSubtext: { fontFamily: fonts.bodyRegular, fontSize: 10, color: colors.navInactive, marginTop: 2 },
  sectionTitle: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textPrimary, marginBottom: 10 },
  errandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  errandItem: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
  errandDate: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.navInactive, marginTop: 2 },
  errandCommission: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center" },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
  historyButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised,
    borderRadius: 12, height: 44, marginTop: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle,
  },
  historyButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textTertiary, marginLeft: 8 },
});