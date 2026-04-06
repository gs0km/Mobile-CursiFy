import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";
import adminService from "../services/adminService";
import courseService from "../services/courseService";
import { AdminOverview, Course, User } from "../types";

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

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    adminService.getUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false));

    setLoadingCourses(true);
    courseService.getAll()
      .then(setCourses)
      .finally(() => setLoadingCourses(false));
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

  const handleDeleteCourse = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      await courseService.remove(courseId);
      setCourses((prev) => prev.filter((c) => c.course_id !== courseId));
    } finally {
      setDeletingId(null);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: theme.spacing.l }}>
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

      <Text style={styles.sectionTitle}>Cursos ativos</Text>
      {loadingCourses ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.m }} />
      ) : courses.map((course) => (
        <View key={course.course_id} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName} numberOfLines={1}>{course.title}</Text>
            <Text style={styles.rowMeta}>{course.category} • {course.teacher_name}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnDelete]}
            onPress={() => handleDeleteCourse(course.course_id)}
            disabled={deletingId === course.course_id}
          >
            {deletingId === course.course_id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionText}>Apagar</Text>
            }
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Usuários cadastrados</Text>
      {loadingUsers ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing.m }} />
      ) : users.map((item) => (
        <View key={item.user_id} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{item.username}</Text>
            <Text style={styles.rowMeta}>{item.email} • {item.role}</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, item.active ? styles.btnActive : styles.btnInactive]}
            onPress={() => handleToggle(item)}
            disabled={togglingId === item.user_id}
          >
            {togglingId === item.user_id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionText}>{item.active ? "Inativar" : "Ativar"}</Text>
            }
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
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
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textMain,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowInfo: { flex: 1, marginRight: theme.spacing.m },
  rowName: { fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.body },
  rowMeta: { color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 2 },
  actionBtn: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radius.full,
    minWidth: 80,
    alignItems: "center",
  },
  btnDelete: { backgroundColor: "#ef4444" },
  btnActive: { backgroundColor: "#ef4444" },
  btnInactive: { backgroundColor: "#22c55e" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: theme.typography.small },
});
