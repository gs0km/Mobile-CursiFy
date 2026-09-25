import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { ChatMessage } from "../types";

function privateKey(studentId: string, teacherId: string) {
  return `cursify_chat_${[studentId, teacherId].sort().join("_")}`;
}

export const chatService = {
  getTeacherMessages: async (userA?: string, userB?: string): Promise<ChatMessage[]> => {
    if (!userA || !userB) return [];
    return chatService.getPrivateMessages(userA, userB);
  },

  sendTeacherMessage: async (senderId: string, recipientId: string, senderName: string, content: string): Promise<void> => {
    await api.post("/chat", { remetente: senderName, remetenteId: Number(senderId), destinatarioId: Number(recipientId), usuarioId: Number(senderId), mensagem: { conteudo: content } });
  },

  getPrivateMessages: async (studentId: string, teacherId: string): Promise<ChatMessage[]> => {
    const { data } = await api.get<any[]>(`/chat/conversa/${studentId}/${teacherId}`);
    return data.map((row) => ({ message_id: String(row.id), sender_id: String(row.remetenteId), sender_name: row.remetente, content: row.mensagem?.conteudo || row.conteudo, created_at: row.dataChat || row.mensagem?.dataMensagem }));
  },

  sendPrivateMessage: async (studentId: string, teacherId: string, senderId: string, senderName: string, content: string): Promise<void> => {
    await api.post("/chat", { remetente: senderName, remetenteId: Number(senderId), destinatarioId: Number(teacherId), usuarioId: Number(senderId), mensagem: { conteudo: content } });
  },

  getLastMessageTime: async (userA: string, userB: string): Promise<string | null> => {
    const msgs = await chatService.getPrivateMessages(userA, userB);
    return msgs.length > 0 ? msgs[msgs.length - 1].created_at : null;
  },

  getLastMessage: async (userA: string, userB: string): Promise<ChatMessage | null> => {
    const msgs = await chatService.getPrivateMessages(userA, userB);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  },

  markAsRead: async (userA: string, userB: string): Promise<void> => {
    await AsyncStorage.setItem(`cursify_read_${privateKey(userA, userB)}`, new Date().toISOString());
  },

  hasUnread: async (userId: string, otherId: string): Promise<boolean> => {
    const raw = await AsyncStorage.getItem(privateKey(userId, otherId));
    if (!raw) return false;
    const msgs: ChatMessage[] = JSON.parse(raw);
    const lastRead = await AsyncStorage.getItem(`cursify_read_${privateKey(userId, otherId)}`);
    const unread = msgs.filter((m) => m.sender_id !== userId && (!lastRead || m.created_at > lastRead));
    return unread.length > 0;
  },

  clearMessages: async (userA: string, userB: string): Promise<void> => {
    const key = privateKey(userA, userB);
    await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(`cursify_read_${key}`);
  },

  hideContact: async (userId: string, otherId: string): Promise<void> => {
    const key = privateKey(userId, otherId);
    await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(`cursify_read_${key}`);
    const hidden = await AsyncStorage.getItem(`cursify_hidden_${userId}`);
    const list: string[] = hidden ? JSON.parse(hidden) : [];
    if (!list.includes(otherId)) list.push(otherId);
    await AsyncStorage.setItem(`cursify_hidden_${userId}`, JSON.stringify(list));
  },

  getHiddenContacts: async (userId: string): Promise<string[]> => {
    const raw = await AsyncStorage.getItem(`cursify_hidden_${userId}`);
    return raw ? JSON.parse(raw) : [];
  },

  getUnreadCount: async (userId: string, otherId: string): Promise<number> => {
    const raw = await AsyncStorage.getItem(privateKey(userId, otherId));
    if (!raw) return 0;
    const msgs: ChatMessage[] = JSON.parse(raw);
    const lastRead = await AsyncStorage.getItem(`cursify_read_${privateKey(userId, otherId)}`);
    return msgs.filter((m) => m.sender_id !== userId && (!lastRead || m.created_at > lastRead)).length;
  },
};
