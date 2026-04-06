import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { defaultAvatarBase64 } from "../constants/images";
import { theme } from "../constants/theme";
import { UpdateProfilePayload, User } from "../types";

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  loading: boolean;
  feedback: string;
}

export function ProfileScreen({ user, onLogout, onUpdateProfile, loading, feedback }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);

  const avatarUri = user.profile_image_base64 || defaultAvatarBase64;

  const handleSave = async () => {
    await onUpdateProfile({
      username: username.trim(),
      bio: bio.trim(),
      profile_image_base64: user.profile_image_base64,
    });
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Seu perfil</Text>
      <View style={styles.card}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        {editing ? (
          <>
            <AppInput label="Username" value={username} onChangeText={setUsername} testID="profile-username" />
            <AppInput label="Bio" value={bio} onChangeText={setBio} testID="profile-bio" />
            <View style={styles.row}>
              <AppButton label="Salvar" onPress={handleSave} loading={loading} style={styles.half} testID="profile-save" />
              <AppButton label="Cancelar" variant="outline" onPress={() => setEditing(false)} style={styles.half} testID="profile-cancel" />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{user.username}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>Perfil: {user.role}</Text>
            <Text style={styles.bio}>{user.bio || "Sem bio informada."}</Text>
            <AppButton label="Editar perfil" variant="secondary" onPress={() => setEditing(true)} style={styles.editBtn} testID="profile-edit" />
          </>
        )}
      </View>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <AppButton label="Sair da conta" variant="outline" onPress={onLogout} testID="logout-button" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl },
  title: { fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.l },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    alignItems: "center",
    marginBottom: theme.spacing.l,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: theme.colors.surfaceHighlight, marginBottom: theme.spacing.m },
  name: { fontSize: 22, color: theme.colors.textMain, fontWeight: "700" },
  meta: { marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small },
  bio: { marginTop: theme.spacing.m, color: theme.colors.textMain, fontSize: theme.typography.body, width: "100%" },
  editBtn: { marginTop: theme.spacing.m, alignSelf: "stretch" },
  row: { flexDirection: "row", gap: theme.spacing.s, marginTop: theme.spacing.s, width: "100%" },
  half: { flex: 1 },
  feedback: { marginBottom: theme.spacing.m, color: theme.colors.primary, fontSize: theme.typography.small },
});
