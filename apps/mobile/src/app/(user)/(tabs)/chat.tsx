import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { colors, fonts } from "../../../theme";

const ARCHIVED_STATUSES = ["confirmed", "cancelled"];

interface ConversationRow {
  errandId: string;
  itemDescription: string;
  status: string;
  scoutName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export default function UserChatScreen() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Chat only exists from "accepted" onward (Section 12: opens the
    // moment a scout accepts) — open errands have no scout, no thread.
    const { data: errands } = await supabase
      .from("errands")
      .select("id, item_description, status, scout_id")
      .eq("requester_id", user.id)
      .not("scout_id", "is", null)
      .order("created_at", { ascending: false });

    if (!errands || errands.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const errandIds = errands.map((e) => e.id);
    const scoutIds = [...new Set(errands.map((e) => e.scout_id).filter(Boolean))] as string[];

    const [{ data: messages }, { data: scoutProfiles }] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("errand_id, message_text, created_at")
        .in("errand_id", errandIds)
        .order("created_at", { ascending: true }),
      supabase.from("public_profiles").select("id, full_name").in("id", scoutIds),
    ]);

    const lastMessageByErrand = new Map<string, { text: string | null; at: string }>();
    (messages ?? []).forEach((m) => {
      lastMessageByErrand.set(m.errand_id, { text: m.message_text, at: m.created_at });
    });

    const nameByScoutId = new Map<string, string>();
    (scoutProfiles ?? []).forEach((p) => {
      if (p.id) {
        nameByScoutId.set(p.id, p.full_name ?? "Scout");
      }
    });

    const rows: ConversationRow[] = errands.map((e) => {
      const last = lastMessageByErrand.get(e.id);
      return {
        errandId: e.id,
        itemDescription: e.item_description,
        status: e.status,
        scoutName: nameByScoutId.get(e.scout_id!) ?? "Scout",
        lastMessage: last?.text ?? null,
        lastMessageAt: last?.at ?? null,
      };
    });

    setConversations(rows);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const active = conversations.filter((c) => !ARCHIVED_STATUSES.includes(c.status));
  const archived = conversations.filter((c) => ARCHIVED_STATUSES.includes(c.status));

  function renderRow(item: ConversationRow, prefix = "") {
    return (
      <Pressable
        key={`${prefix}${item.errandId}`}
        style={styles.row}
        onPress={() => router.push(`/(user)/errand/${item.errandId}`)}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{item.scoutName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <Text style={styles.scoutName}>{item.scoutName}</Text>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.itemDescription}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ?? "No messages yet"}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[]}
      renderItem={null}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Chat</Text>

          {active.length === 0 && archived.length === 0 && !loading && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Conversations with your Scout appear here once someone accepts your errand.
              </Text>
            </View>
          )}

          {active.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active</Text>
              {active.map((r) => renderRow(r, "a:"))}
            </>
          )}

          {archived.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Archived</Text>
              {archived.map((r) => renderRow(r, "z:"))}
            </>
          )}
        </>
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
    color: colors.accentLight 
  },
  sectionTitle: { fontFamily: fonts.headingMedium, fontSize: 14, color: colors.textSecondary, marginBottom: 10, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.accent },
  rowContent: { flex: 1 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  scoutName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  itemLabel: { fontFamily: fonts.bodyRegular, fontSize: 11, color: colors.textSecondary, opacity: 0.8, maxWidth: 120 },
  lastMessage: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary },
  emptyCard: { backgroundColor: colors.surfaceRaised, borderRadius: 14, padding: 20, alignItems: "center" },
  emptyText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
});