import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconArrowLeft, IconChevronRight } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";

interface PayoutBatch {
  id: string;
  week_start: string;
  week_end: string;
  payout_date: string;
  total_amount: number;
  status: "pending" | "paid";
}

export default function PayoutHistoryScreen() {
  const [batches, setBatches] = useState<PayoutBatch[]>([]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("payout_batches")
      .select("id, week_start, week_end, payout_date, total_amount, status")
      .eq("scout_id", user.id)
      .order("week_start", { ascending: false });
    setBatches(data ?? []);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={batches}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment history</Text>
          <View style={{ width: 20 }} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.batchCard}>
          <View style={styles.batchRow}>
            <View>
              <Text style={styles.batchWeek}>
                {formatDate(item.week_start)} – {formatDate(item.week_end)}
              </Text>
              <Text style={styles.batchPayoutDate}>Payout: {formatDate(item.payout_date)}</Text>
            </View>
            <View style={styles.batchAmountBlock}>
              <Text style={styles.batchAmount}>₦{item.total_amount.toLocaleString()}</Text>
              <View style={[styles.statusPill, item.status === "paid" && styles.statusPillPaid]}>
                <Text style={[styles.statusText, item.status === "paid" && styles.statusTextPaid]}>
                  {item.status === "paid" ? "Paid" : "Pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No payout batches yet. Your first weekly batch appears here once generated.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  batchCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 14, marginBottom: 10 },
  batchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  batchWeek: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  batchPayoutDate: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  batchAmountBlock: { alignItems: "flex-end" },
  batchAmount: { fontFamily: fonts.headingMedium, fontSize: 16, color: colors.textPrimary, marginBottom: 6 },
  statusPill: { backgroundColor: colors.surfaceElevated, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10 },
  statusPillPaid: { backgroundColor: "#16A34A22" },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.warning },
  statusTextPaid: { color: colors.success },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center", marginTop: 12 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
});