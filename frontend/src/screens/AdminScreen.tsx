import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";
import adminService from "../services/adminService";
import { AdminOverview, User } from "../types";

interface AdminScreenProps {
  isAdmin: boolean;
  data: AdminOverview | null;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function AdminScreen({ isAdmin, data }: AdminScreenProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    adminService.getUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false));
  }, [isAdmin]);

  const handleToggle = async (user: User) => {
    setTogglingId(user.user_id);
    try {
      const updated = await adminService.setUserStatus(user.user_id, !user.active);
      setUsers((prev) => prev.map((u) => u.user_id === updated.user_id ? updated : u));
    } finally {
      setTogglingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Área administrativa</Text>
        <Text style={styles.subtitle}>Somente usuários admin podem visualizar esta área.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel administrativo</Text>

      {data && (
        <View style={styles.grid}>
          <StatCard label="Usuários" value={data.users_total} />
          <StatCard label="Alunos" value={data.students_total} />
          <StatCard label="Professores" value={data.teachers_total} />
          <StatCard label="Admins" value={data.admins_total} />
          <StatCard label="Cursos" value={data.courses_total} />
          <StatCard label="Inscrições" value={data.enrollments_total} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Usuários cadastrados</Text>

      {loadingUsers ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.l }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.user_id}
          contentContainerStyle={{ paddingBottom: theme.spacing.l }}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.username}</Text>
                <Text style={styles.userMeta}>{item.email} • {item.role}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, item.active ? styles.btnActive : styles.btnInactive]}
                onPress={() => handleToggle(item)}
                disabled={togglingId === item.user_id}
              >
                {togglingId === item.user_id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.toggleText}>{item.active ? "Inativar" : "Ativar"}</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  title: { fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain },
  subtitle: { marginTop: theme.spacing.s, fontSize: theme.typography.body, color: theme.colors.textMuted },
  grid: { marginTop: theme.spacing.l, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.s },
  card: {
    width: "48%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    minHeight: 96,
    justifyContent: "center",
  },
  value: { fontSize: 28, fontWeight: "800", color: theme.colors.primary },
  label: { marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small },
  sectionTitle: {
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
    fontSize: theme.typography.h3 ?? 16,
    fontWeight: "700",
    color: theme.colors.textMain,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfo: { flex: 1, marginRight: theme.spacing.m },
  userName: { fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.body },
  userMeta: { color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 2 },
  toggleBtn: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radius.full,
    minWidth: 80,
    alignItems: "center",
  },
  btnActive: { backgroundColor: "#ef4444" },
  btnInactive: { backgroundColor: "#22c55e" },
  toggleText: { color: "#fff", fontWeight: "600", fontSize: theme.typography.small },
});
