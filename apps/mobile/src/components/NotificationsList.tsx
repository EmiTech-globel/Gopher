import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect, router } from "expo-router";
import {
  IconArrowLeft,
  IconMessageCircle,
  IconCheck,
  IconPackage,
  IconCoin,
  IconX,
  IconReceipt,
  IconShieldCheck,
  IconShieldX,
  IconWallet,
} from "@tabler/icons-react-native";
import { supabase } from "../lib/supabase";
import { markAllNotificationsRead } from "../lib/notificationsReadState";
import { colors, fonts } from "../theme";

interface NotificationRow {
  id: string;
  type: string | null;
  title: string;
  body: string | null;
  errand_id: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsList({ errandBasePath }: { errandBasePath: string }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const hasUnread = notifications.some((n) => !n.read);

  async function handleMarkAllRead() {
    if (!hasUnread || markingAll) return;
    setMarkingAll(true);
    await markAllNotificationsRead();
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
  }

  async function handlePress(item: NotificationRow) {
    if (!item.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", item.id);
      setNotifications((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    }
    if (item.errand_id) {
      router.push(`${errandBasePath}/${item.errand_id}` as any);
    }
  }

  function timeAgo(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function NotifIcon({ type }: { type: string | null }) {
    const props = { size: 16, color: colors.accent, strokeWidth: 1.75 };
    switch (type) {
      case "errand_accepted": return <IconCheck {...props} />;
      case "errand_delivered": return <IconPackage {...props} />;
      case "errand_confirmed": return <IconCheck {...props} />;
      case "errand_cancelled": return <IconX {...props} color={colors.error} />;
      case "balance_request_created":
      case "balance_request_approved": return <IconCoin {...props} />;
      case "proof_submitted": return <IconReceipt {...props} />;
      case "verification_approved": return <IconShieldCheck {...props} />;
      case "verification_rejected": return <IconShieldX {...props} color={colors.error} />;
      case "payout_sent": return <IconWallet {...props} />;
      default: return <IconMessageCircle {...props} />;
    }
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={notifications}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconArrowLeft size={28} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Pressable onPress={handleMarkAllRead} disabled={!hasUnread || markingAll} hitSlop={8}>
            <Text style={[styles.markAllText, (!hasUnread || markingAll) && styles.markAllTextDisabled]}>
              Mark all read
            </Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={[styles.row, !item.read && styles.rowUnread]} onPress={() => handlePress(item)}>
          <View style={[styles.iconCircle, (item.type === "errand_cancelled" || item.type === "verification_rejected") && styles.iconCircleError]}>
            <NotifIcon type={item.type} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
            {item.body && <Text style={styles.notifBody} numberOfLines={1}>{item.body}</Text>}
            <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceBase },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  headerTitle: { fontFamily: fonts.headingMedium, fontSize: 18, color: colors.textPrimary },
  markAllText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.accent },
  markAllTextDisabled: { color: colors.textMuted, opacity: 0.6 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 12, marginBottom: 10 },
  rowUnread: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.accent },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center", marginRight: 12 },
  iconCircleError: { backgroundColor: colors.error + "22" },
  rowContent: { flex: 1 },
  notifTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  notifBody: { fontFamily: fonts.bodyRegular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notifTime: { fontFamily: fonts.bodyRegular, fontSize: 10, color: colors.textMuted, opacity: 0.7, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginLeft: 8 },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center", marginTop: 12 },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textMuted, textAlign: "center" },
});