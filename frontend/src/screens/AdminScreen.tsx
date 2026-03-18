import { StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";
import { AdminOverview } from "../types";

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
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Área administrativa</Text>
        <Text style={styles.subtitle}>Somente usuários admin podem visualizar os indicadores de moderação.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel administrativo</Text>
      <Text style={styles.subtitle}>Monitoramento inicial de usuários, cursos e inscrições.</Text>

      {data ? (
        <View style={styles.grid}>
          <StatCard label="Usuários" value={data.users_total} />
          <StatCard label="Alunos" value={data.students_total} />
          <StatCard label="Professores" value={data.teachers_total} />
          <StatCard label="Admins" value={data.admins_total} />
          <StatCard label="Cursos" value={data.courses_total} />
          <StatCard label="Inscrições" value={data.enrollments_total} />
        </View>
      ) : (
        <Text style={styles.subtitle}>Carregando métricas...</Text>
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
  title: {
    fontSize: theme.typography.h2,
    fontWeight: "700",
    color: theme.colors.textMain,
  },
  subtitle: {
    marginTop: theme.spacing.s,
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
  },
  grid: {
    marginTop: theme.spacing.l,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
  },
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
  value: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  label: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
});