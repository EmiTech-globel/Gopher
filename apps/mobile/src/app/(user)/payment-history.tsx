import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconArrowLeft } from "@tabler/icons-react-native";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme";

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  errand_id: string;
  item_description: string;
}

const TYPE_LABELS: Record<string, string> = {
  payment_in: "Errand payment",
  balance_topup: "Additional funds",
  refund: "Refund",
};

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: errands } = await supabase
      .from("errands")
      .select("id, item_description")
      .eq("requester_id", user.id);

    if (!errands || errands.length === 0) {
      setTransactions([]);
      return;
    }

    const errandMap = new Map(errands.map((e) => [e.id, e.item_description]));
    const errandIds = errands.map((e) => e.id);

    const { data: txns } = await supabase
      .from("transactions")
      .select("id, type, amount, status, created_at, errand_id")
      .in("errand_id", errandIds)
      .order("created_at", { ascending: false });

    setTransactions(
      (txns ?? []).map((t) => ({ ...t, item_description: errandMap.get(t.errand_id) ?? "Errand" }))
    );
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      data={transactions}
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
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>{TYPE_LABELS[item.type] ?? item.type}</Text>
            <Text style={styles.rowItem} numberOfLines={1}>{item.item_description}</Text>
            <Text style={styles.rowDate}>
              {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <Text style={styles.rowAmount}>₦{item.amount.toLocaleString()}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No payments yet. Your errand payments will show up here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  rowItem: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textMuted, opacity: 0.7, marginTop: 4 },
  rowAmount: { fontFamily: fonts.headingMedium, fontSize: 15, color: colors.textPrimary },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center", marginTop: 12 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
});