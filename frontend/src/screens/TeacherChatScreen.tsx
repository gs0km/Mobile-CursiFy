import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { chatService } from "../services/chatService";
import { ChatMessage as ChatMessageType, User } from "../types";
import { getAuthToken } from "../services/api";
import authService from "../services/authService";

interface Props {
  userName: string;
}

type Tab = "students" | "teachers";

interface UserWithPreview extends User {
  lastMsg?: ChatMessageType | null;
  unread?: boolean;
}

export default function TeacherChatScreen({ userName }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const userId = getAuthToken() || "";

  const [tab, setTab] = useState<Tab>("students");
  const [view, setView] = useState<"list" | "chat">("list");
  const [students, setStudents] = useState<UserWithPreview[]>([]);
  const [teachers, setTeachers] = useState<UserWithPreview[]>([]);
  const [allStudents, setAllStudents] = useState<UserWithPreview[]>([]);
  const [allTeachers, setAllTeachers] = useState<UserWithPreview[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPreview | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"clear" | "delete" | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    authService.getAll().then(async (users) => {
      const studs = users.filter((u) => u.role === "student");
      const tchs = users.filter((u) => u.role === "teacher" && u.user_id !== userId);
      const withPreview = async (list: User[]): Promise<UserWithPreview[]> => {
        const [previews, unreads] = await Promise.all([
          Promise.all(list.map((u) => chatService.getLastMessage(userId, u.user_id))),
          Promise.all(list.map((u) => chatService.hasUnread(userId, u.user_id))),
        ]);
        const hidden = await chatService.getHiddenContacts(userId);
        return list
          .filter((u) => !hidden.includes(u.user_id))
          .map((u, i) => ({ ...u, lastMsg: previews[i], unread: unreads[i] }))
          .sort((a, b) => (b.lastMsg?.created_at ?? "") > (a.lastMsg?.created_at ?? "") ? 1 : -1);
      };
      const withPreviewAll = async (list: User[]): Promise<UserWithPreview[]> => {
        const previews = await Promise.all(list.map((u) => chatService.getLastMessage(userId, u.user_id)));
        const unreads = await Promise.all(list.map((u) => chatService.hasUnread(userId, u.user_id)));
        return list.map((u, i) => ({ ...u, lastMsg: previews[i], unread: unreads[i] }));
      };
      setStudents(await withPreview(studs));
      setTeachers(await withPreview(tchs));
      setAllStudents(await withPreviewAll(studs));
      setAllTeachers(await withPreviewAll(tchs));
      setLoading(false);
      listIntervalRef.current = setInterval(async () => {
        const refreshUnreads = async (list: UserWithPreview[]): Promise<UserWithPreview[]> =>
          Promise.all(list.map(async (u) => ({ ...u, unread: await chatService.hasUnread(userId, u.user_id) })));
        setStudents((prev) => { refreshUnreads(prev).then(setStudents); return prev; });
        setTeachers((prev) => { refreshUnreads(prev).then(setTeachers); return prev; });
      }, 4000);
    }).catch(() => setLoading(false));
    return () => { if (listIntervalRef.current) clearInterval(listIntervalRef.current); };
  }, []);

  const openChat = async (user: UserWithPreview) => {
    setSelectedUser(user);
    setView("chat");
    if (tab !== "teachers") await chatService.markAsRead(userId, user.user_id);
    const msgs = tab === "teachers"
      ? await chatService.getTeacherMessages(userId, user.user_id)
      : await chatService.getPrivateMessages(userId, user.user_id);
    setMessages(msgs);
    const update = (prev: UserWithPreview[]) => prev.map((u) => u.user_id === user.user_id ? { ...u, unread: false } : u);
    setStudents(update);
    setTeachers(update);
    intervalRef.current = setInterval(async () => {
      const updated = tab === "teachers"
        ? await chatService.getTeacherMessages(userId, user.user_id)
        : await chatService.getPrivateMessages(userId, user.user_id);
      setMessages(updated);
      if (tab !== "teachers") await chatService.markAsRead(userId, user.user_id);
    }, 3000);
  };

  const closeChat = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setView("list");
    setSelectedUser(null);
    setMessages([]);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    if (confirmAction === "clear") {
      await chatService.clearMessages(userId, selectedUser.user_id);
      setMessages([]);
      setStudents((prev) => prev.map((u) => u.user_id === selectedUser.user_id ? { ...u, lastMsg: null } : u));
      setTeachers((prev) => prev.map((u) => u.user_id === selectedUser.user_id ? { ...u, lastMsg: null } : u));
    } else if (confirmAction === "delete") {
      await chatService.hideContact(userId, selectedUser.user_id);
      setStudents((prev) => prev.filter((u) => u.user_id !== selectedUser.user_id));
      setTeachers((prev) => prev.filter((u) => u.user_id !== selectedUser.user_id));
      setConfirmAction(null);
      closeChat();
      return;
    }
    setConfirmAction(null);
  };

  const send = async () => {
    if (!text.trim() || !selectedUser) return;
    if (tab === "teachers") {
      await chatService.sendTeacherMessage(userId, selectedUser.user_id, userName, text.trim());
      setMessages(await chatService.getTeacherMessages(userId, selectedUser.user_id));
    } else {
      await chatService.sendPrivateMessage(userId, selectedUser.user_id, userId, userName, text.trim());
      const msgs = await chatService.getPrivateMessages(userId, selectedUser.user_id);
      setMessages(msgs);
      const lastMsg = msgs[msgs.length - 1];
      setStudents((prev) => [{ ...selectedUser, lastMsg }, ...prev.filter((u) => u.user_id !== selectedUser.user_id)]);
    }
    setText("");
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const baseList = search
    ? (tab === "students" ? allStudents : allTeachers)
    : (tab === "students" ? students : teachers);
  const list = baseList.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  if (view === "chat") {
    return (
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: c.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, { backgroundColor: "#0EA5E9" }]}>
          <TouchableOpacity onPress={closeChat}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{selectedUser?.username}</Text>
              <Text style={styles.headerSub}>{tab === "students" ? "Aluno" : "Professor"}</Text>
            </View>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuBtn}>
              <Text style={styles.menuBtnText}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.message_id}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={[styles.empty, { color: c.textMuted }]}>Nenhuma mensagem ainda. Inicie a conversa!</Text>}
          renderItem={({ item }) => {
            const own = item.sender_id === userId;
            return (
              <View style={[styles.row, own && styles.rowOwn]}>
                {!own && (
                  <View style={[styles.msgAvatar, { backgroundColor: c.primary }]}>
                    <Text style={styles.msgAvatarText}>{item.sender_name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.bubble, { backgroundColor: own ? c.primary : c.surface, borderBottomRightRadius: own ? 4 : 16, borderBottomLeftRadius: own ? 16 : 4 }]}>
                  {!own && <Text style={[styles.sender, { color: c.primary }]}>{item.sender_name}</Text>}
                  <Text style={[styles.msgText, { color: own ? "#fff" : c.textMain }]}>{item.content}</Text>
                  <Text style={[styles.time, { color: own ? "#ffffffaa" : c.textMuted }]}>
                    {new Date(item.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputRow, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: c.background, color: c.textMain, borderColor: c.border }]}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={c.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: c.primary, opacity: text.trim() ? 1 : 0.4 }]} onPress={send} disabled={!text.trim()}>
            <Text style={styles.sendBtnText}>Enviar</Text>
          </TouchableOpacity>
        </View>

        {/* Menu modal */}
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <View style={[styles.menuBox, { backgroundColor: c.surface }]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setConfirmAction("clear"); }}>
                <Text style={[styles.menuItemText, { color: c.textMain }]}>Limpar conversa</Text>
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: c.border }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setConfirmAction("delete"); }}>
                <Text style={[styles.menuItemText, { color: "#EF4444" }]}>Apagar contato</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Confirm modal */}
        <Modal transparent visible={confirmAction !== null} animationType="fade" onRequestClose={() => setConfirmAction(null)}>
          <Pressable style={styles.overlay} onPress={() => setConfirmAction(null)}>
            <View style={[styles.confirmBox, { backgroundColor: c.surface }]}>
              <Text style={[styles.confirmTitle, { color: c.textMain }]}>
                {confirmAction === "clear" ? "Limpar conversa" : "Apagar contato"}
              </Text>
              <Text style={[styles.confirmMsg, { color: c.textMuted }]}>
                {confirmAction === "clear"
                  ? "Apagar todas as mensagens desta conversa?"
                  : `Remover ${selectedUser?.username} do seu chat?`}
              </Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={[styles.confirmBtn, { borderColor: c.border }]} onPress={() => setConfirmAction(null)}>
                  <Text style={{ color: c.textMuted }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: "#EF4444", borderColor: "#EF4444" }]} onPress={handleConfirm}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {confirmAction === "clear" ? "Limpar" : "Apagar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { backgroundColor: "#0EA5E9" }]}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        <TouchableOpacity style={[styles.tabBtn, tab === "students" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]} onPress={() => { setTab("students"); setSearch(""); }}>
          <Text style={[styles.tabText, { color: tab === "students" ? c.primary : c.textMuted }]}>Alunos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "teachers" && { borderBottomColor: c.primary, borderBottomWidth: 2 }]} onPress={() => { setTab("teachers"); setSearch(""); }}>
          <Text style={[styles.tabText, { color: tab === "teachers" ? c.primary : c.textMuted }]}>Professores</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { borderColor: c.border }]}>
        <TextInput
          style={[styles.searchInput, { color: c.textMain }]}
          placeholder={`Pesquisar ${tab === "students" ? "aluno" : "professor"}...`}
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
      ) : list.length === 0 ? (
        <Text style={[styles.empty, { color: c.textMuted }]}>
          {search ? "Nenhum resultado encontrado." : `Nenhum ${tab === "students" ? "aluno" : "professor"} disponível.`}
        </Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
              onPress={() => openChat(item)}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: c.primary }]}>
                  <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userRow}>
                  <Text style={[styles.userName, { color: c.textMain }]}>{item.username}</Text>
                  {item.lastMsg && (
                    <Text style={[styles.previewTime, { color: c.textMuted }]}>
                      {new Date(item.lastMsg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                </View>
                <Text style={[styles.previewText, { color: c.textMuted }]} numberOfLines={1}>
                  {item.lastMsg
                    ? (item.lastMsg.sender_id === userId ? "Você: " : "") + item.lastMsg.content
                    : tab === "students" ? "Aluno" : "Professor"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 12, color: "#ffffffaa", marginTop: 2 },
  backText: { color: "#ffffffcc", fontSize: 14, marginBottom: 4 },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: "600" },
  searchBox: { margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "transparent" },
  searchInput: { fontSize: 15 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
  userItem: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, gap: 12 },
  avatarWrap: { width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  userInfo: { flex: 1 },
  userRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userName: { fontSize: 16, fontWeight: "600" },
  previewText: { fontSize: 13, marginTop: 2 },
  previewTime: { fontSize: 12 },
  row: { marginVertical: 4, alignItems: "flex-start", flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  rowOwn: { alignItems: "flex-end", flexDirection: "row-reverse" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginTop: 2, flexShrink: 0 },
  msgAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  bubble: { maxWidth: "75%", padding: 12, borderRadius: 16 },
  sender: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  msgText: { fontSize: 15 },
  time: { fontSize: 11, marginTop: 4 },
  inputRow: { flexDirection: "row", padding: 10, borderTopWidth: 1, alignItems: "flex-end" },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100, marginRight: 8 },
  sendBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnText: { color: "#fff", fontWeight: "600" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444", position: "absolute", bottom: 0, right: 0, borderWidth: 1.5, borderColor: "#fff" },
  menuBtn: { padding: 8 },
  menuBtnText: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  overlay: { flex: 1, backgroundColor: "#00000055", justifyContent: "center", alignItems: "center" },
  menuBox: { borderRadius: 12, width: 220, overflow: "hidden", elevation: 5 },
  menuItem: { paddingVertical: 16, paddingHorizontal: 20 },
  menuItemText: { fontSize: 16 },
  menuDivider: { height: 1 },
  confirmBox: { borderRadius: 12, width: 280, padding: 20, elevation: 5 },
  confirmTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  confirmMsg: { fontSize: 14, marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 10 },
  confirmBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
});
