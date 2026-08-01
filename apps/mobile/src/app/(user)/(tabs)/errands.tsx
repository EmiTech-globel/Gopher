import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { IconMapPin } from "@tabler/icons-react-native";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

type FilterTab = "active" | "completed";

const ACTIVE_STATUSES = ["open", "accepted", "purchased", "delivered", "disputed"];

interface ErrandRow {
  id: string;
  item_description: string;
  pickup_location: string;
  dropoff_location: string;
  item_budget: number;
  delivery_fee: number;
  status: string;
  created_at: string;
}

export default function UserErrandsScreen() {
  const [errands, setErrands] = useState<ErrandRow[]>([]);
  const [filter, setFilter] = useState<FilterTab>("active");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("errands")
      .select("id, item_description, pickup_location, dropoff_location, item_budget, delivery_fee, status, created_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    setErrands(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filtered = errands.filter((e) =>
    filter === "active" ? ACTIVE_STATUSES.includes(e.status) : !ACTIVE_STATUSES.includes(e.status)
  );

  function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Your Errands</Text>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, filter === "active" && styles.tabActive]}
              onPress={() => setFilter("active")}
            >
              <Text style={[styles.tabText, filter === "active" && styles.tabTextActive]}>Active</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, filter === "completed" && styles.tabActive]}
              onPress={() => setFilter("completed")}
            >
              <Text style={[styles.tabText, filter === "completed" && styles.tabTextActive]}>Completed</Text>
            </Pressable>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/(user)/errand/${item.id}`)}>
          <Text style={styles.itemText} numberOfLines={1}>{item.item_description}</Text>
          <View style={styles.routeRow}>
            <IconMapPin size={13} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.routeText} numberOfLines={1}>
              {item.pickup_location} → {item.dropoff_location}
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerValue}>
              ₦{(item.item_budget + item.delivery_fee).toLocaleString()}
            </Text>
            <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {filter === "active" ? "No active errands right now." : "No completed errands yet."}
            </Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 140 },
  title: { 
    fontFamily: fonts.headingBold,
    fontSize: 22,
    marginBottom: 20, 
    color: colors.accentLight, 
  },
  tabRow: { flexDirection: "row", marginBottom: 20 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    marginRight: 8,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 16, marginBottom: 12 },
  itemText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 6 },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  routeText: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textSecondary, marginLeft: 6, flexShrink: 1 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerValue: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.accent },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center", marginTop: 8 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
});