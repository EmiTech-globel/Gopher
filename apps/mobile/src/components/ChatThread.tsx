import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSend } from "@tabler/icons-react-native";
import { supabase } from "../lib/supabase";
import { colors, fonts } from "../theme";

interface ChatMessage {
  id: string;
  errand_id: string;
  sender_id: string;
  message_text: string | null;
  photo_url: string | null;
  created_at: string;
}

export function ChatThread({ errandId }: { errandId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("errand_id", errandId)
      .order("created_at", { ascending: true });
    // Ensure messages are unique by id to avoid duplicate-key warnings
    const unique: ChatMessage[] = [];
    const seen = new Set<string>();
    (data ?? []).forEach((m) => {
      const id = String(m.id);
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(m);
      }
    });
    setMessages(unique);
  }, [errandId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    loadMessages();
    if (!currentUserId) return;

    // Mark all unread notifications for this errand as read so the badge
    // and list stay in sync — the user is now actively viewing the chat.
    supabase.from("notifications")
      .update({ read: true })
      .eq("user_id", currentUserId)
      .eq("errand_id", errandId)
      .eq("read", false);

    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      listRef.current?.scrollToEnd({ animated: true });
    });

    // Only the OTHER party's messages come in via realtime — our own
    // sent messages are added optimistically the moment we tap send
    // (see handleSend), so echoing them back here would just duplicate
    // the bubble a beat later.
    // Channel names are cached by the Supabase client, so reusing a stable
    // name (e.g. just `chat:${errandId}`) means a re-mount can hand back an
    // already-subscribed channel, and calling `.on()` on it throws
    // "cannot add postgres_changes callbacks ... after subscribe()".
    // A per-mount suffix keeps the name unique so the effect is idempotent.
    const channel = supabase
      .channel(`chat:${errandId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `errand_id=eq.${errandId}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          if (incoming.sender_id === currentUserId) return;
          setMessages((current) => {
            const exists = current.some((m) => String(m.id) === String(incoming.id));
            if (exists) return current;
            return [...current, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      show.remove();
      hide.remove();
      supabase.removeChannel(channel);
    };
  }, [errandId, loadMessages, currentUserId]);

  async function handleSend() {
    if (!draft.trim() || !currentUserId) return;
    const text = draft.trim();
    setDraft("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      errand_id: errandId,
      sender_id: currentUserId,
      message_text: text,
      photo_url: null,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ errand_id: errandId, sender_id: currentUserId, message_text: text })
      .select()
      .single();

    if (error) {
      console.error("Failed to send message", error);
      // Roll back the optimistic bubble on failure rather than leaving a
      // message on screen that was never actually saved.
      setMessages((current) => current.filter((m) => m.id !== tempId));
      return;
    }

    setMessages((current) => {
      const replaced = current.map((m) => (m.id === tempId ? (data as ChatMessage) : m));
      // Deduplicate by id while keeping order
      const seen = new Set<string>();
      const unique: ChatMessage[] = [];
      replaced.forEach((m) => {
        const id = String(m.id);
        if (!seen.has(id)) {
          seen.add(id);
          unique.push(m);
        }
      });
      return unique;
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={insets.top}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => {
          if (!keyboardVisible) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        renderItem={({ item }) => {
          const isMine = item.sender_id === currentUserId;
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                {item.message_text}
              </Text>
            </View>
          );
        }}
      />

      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom + 15, 20) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary + "80"}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <IconSend size={16} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingTop: 8 },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  bubbleMine: { backgroundColor: colors.accent, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surfaceRaised, alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.bodyRegular, fontSize: 13, color: colors.textPrimary },
  bubbleTextMine: { color: colors.primary },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceElevated,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 13,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});