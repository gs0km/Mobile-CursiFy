import { Image, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { defaultAvatarBase64 } from "../constants/images";
import { theme } from "../constants/theme";
import { User } from "../types";

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
}

export function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const avatarUri = user.profile_image_base64 || defaultAvatarBase64;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seu perfil</Text>
      <View style={styles.card}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>Perfil: {user.role}</Text>
        <Text style={styles.bio}>{user.bio || "Sem bio informada."}</Text>
      </View>
      <AppButton label="Sair da conta" variant="outline" onPress={onLogout} testID="logout-button" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
  },
  title: {
    fontSize: theme.typography.h2,
    fontWeight: "700",
    color: theme.colors.textMain,
    marginBottom: theme.spacing.l,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    alignItems: "center",
    marginBottom: theme.spacing.l,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.surfaceHighlight,
    marginBottom: theme.spacing.m,
  },
  name: {
    fontSize: 22,
    color: theme.colors.textMain,
    fontWeight: "700",
  },
  meta: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
  bio: {
    marginTop: theme.spacing.m,
    color: theme.colors.textMain,
    fontSize: theme.typography.body,
    textAlign: "left",
    width: "100%",
  },
});