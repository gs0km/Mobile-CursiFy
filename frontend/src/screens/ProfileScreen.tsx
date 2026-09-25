import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useTheme } from "../contexts/ThemeContext";
import { UpdateProfilePayload, User } from "../types";
import authService from "../services/authService";

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  loading: boolean;
  feedback: string;
  enrolledCount: number;
  completedCount: number;
}

const ROLE_LABEL: Record<string, string> = {
  student: "Aluno",
  teacher: "Professor",
  admin: "Administrador",
};

const ROLE_COLOR: Record<string, string> = {
  student: "#4F46E5",
  teacher: "#10B981",
  admin: "#F59E0B",
};

export function ProfileScreen({ user, onLogout, onUpdateProfile, loading, feedback, enrolledCount, completedCount }: ProfileScreenProps) {
  const { theme, isDark, setPreferredTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [localCover, setLocalCover] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setLocalImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 6],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setLocalCover(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const avatarSource = localImage || user.profile_image_base64 ? { uri: localImage ?? user.profile_image_base64 } : null;

  const coverSource = localCover ?? user.cover_image_base64 ?? null;

  const handleSave = async () => {
    await onUpdateProfile({
      username: username.trim(),
      bio: bio.trim(),
      profile_image_base64: localImage ?? user.profile_image_base64,
      cover_image_base64: localCover ?? user.cover_image_base64,
    });
    setEditing(false);
  };

  const handleToggleTheme = async () => {
    const nextTheme = isDark ? "light" : "dark";
    setPreferredTheme(nextTheme);
    await authService.updateTheme(nextTheme);
  };

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  const roleColor = ROLE_COLOR[user.role] ?? "#4F46E5";
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>

      {/* Capa */}
      <View style={styles.coverWrap}>
        {coverSource ? (
          <Image source={{ uri: coverSource }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, { backgroundColor: roleColor + "33" }]} />
        )}
        {editing && (
          <Pressable onPress={pickCover} style={[styles.coverEditBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, marginLeft: 4 }}>Editar capa</Text>
          </Pressable>
        )}

        {/* Avatar sobre a capa */}
        <View style={styles.avatarWrap}>
          <Pressable onPress={editing ? pickImage : undefined}>
            {avatarSource ? <Image source={avatarSource} style={[styles.avatar, { borderColor: theme.colors.background }]} /> : (
              <View style={[styles.avatar, { borderColor: theme.colors.background, backgroundColor: roleColor, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{user.username.slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            {editing && (
              <View style={[styles.avatarOverlay, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Conteúdo do perfil */}
      <View style={{ paddingHorizontal: theme.spacing.l, paddingTop: 52 }}>

        {/* Badge de cargo */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
            <Ionicons name={user.role === "teacher" ? "school-outline" : user.role === "admin" ? "shield-checkmark-outline" : "person-outline"} size={13} color={roleColor} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: roleColor, marginLeft: 4 }}>{roleLabel}</Text>
          </View>
          {joinDate && (
            <Text style={{ fontSize: 11, color: theme.colors.textMuted }}>Membro desde {joinDate}</Text>
          )}
        </View>

        {editing ? (
          <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m }]}>
            <AppInput label="Username" value={username} onChangeText={setUsername} testID="profile-username" />
            <AppInput label="Biografia" value={bio} onChangeText={setBio} testID="profile-bio" />
            <View style={{ flexDirection: "row", gap: theme.spacing.s, marginTop: theme.spacing.s }}>
              <AppButton label="Salvar" onPress={handleSave} loading={loading} style={{ flex: 1 }} testID="profile-save" />
              <AppButton label="Cancelar" variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} testID="profile-cancel" />
            </View>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.textMain }}>{user.username}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 2 }}>@{user.username}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 4 }}>{user.email}</Text>
            <Text style={{ color: theme.colors.textMain, fontSize: theme.typography.body, marginTop: theme.spacing.s, lineHeight: 22 }}>{user.bio || "Sem bio informada."}</Text>

            {/* Botão editar destacado */}
            <Pressable
              onPress={() => setEditing(true)}
              testID="profile-edit"
              style={[styles.editBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, marginLeft: 6 }}>Editar perfil</Text>
            </Pressable>
          </>
        )}

        {/* Cards de estatísticas */}
        <View style={[styles.statsRow, { marginTop: theme.spacing.m, marginBottom: theme.spacing.m }]}>
          <View style={[styles.statCard, { backgroundColor: "#4F46E5" + "18", borderColor: "#4F46E5" + "33" }]}>
            <Ionicons name="book-outline" size={22} color="#4F46E5" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#4F46E5", marginTop: 4 }}>{enrolledCount}</Text>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: "center" }}>Inscritos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#10B981" + "18", borderColor: "#10B981" + "33" }]}>
            <Ionicons name="ribbon-outline" size={22} color="#10B981" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#10B981", marginTop: 4 }}>{completedCount}</Text>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: "center" }}>Concluídos</Text>
          </View>
        </View>

        {/* Configurações */}
        <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: theme.colors.textMuted, marginBottom: theme.spacing.s }}>CONFIGURAÇÕES</Text>

        {/* Tema escuro */}
        <Pressable
          onPress={handleToggleTheme}
          style={[styles.settingRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, marginTop: theme.spacing.s }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textMain, fontSize: theme.typography.body, marginLeft: theme.spacing.s }}>Tema escuro</Text>
          </View>
          <Ionicons name={isDark ? "toggle" : "toggle-outline"} size={28} color={isDark ? theme.colors.primary : theme.colors.textMuted} />
        </Pressable>

        {feedback ? <Text style={{ marginVertical: theme.spacing.m, color: theme.colors.primary, fontSize: theme.typography.small }}>{feedback}</Text> : null}

        <AppButton label="Sair da conta" variant="outline" onPress={onLogout} style={{ marginTop: theme.spacing.l }} testID="logout-button" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverWrap: { position: "relative", height: 140 },
  cover: { width: "100%", height: 140 },
  coverEditBtn: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  avatarWrap: { position: "absolute", bottom: -40, left: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 4 },
  avatarOverlay: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  roleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, paddingVertical: 12, borderRadius: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  langPicker: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: "hidden" },
  langOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
});
