import { FlatList, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { CourseCard } from "../components/CourseCard";
import { theme } from "../constants/theme";
import { Course, CourseLevel } from "../types";

interface TeacherScreenProps {
  canManage: boolean;
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  pedagogyDescription: string;
  setPedagogyDescription: (value: string) => void;
  lessonsCount: string;
  setLessonsCount: (value: string) => void;
  estimatedHours: string;
  setEstimatedHours: (value: string) => void;
  level: CourseLevel;
  setLevel: (value: CourseLevel) => void;
  loading: boolean;
  onCreateCourse: () => void;
  courses: Course[];
  onOpenCourse: (course: Course) => void;
}

const levels: CourseLevel[] = ["beginner", "intermediate", "advanced"];

export function TeacherScreen(props: TeacherScreenProps) {
  if (!props.canManage) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedTitle}>Área de professor</Text>
        <Text style={styles.lockedText}>Este perfil não tem permissão para criar cursos.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={props.courses}
      keyExtractor={(item) => item.course_id}
      ListHeaderComponent={
        <View style={styles.formCard}>
          <Text style={styles.title}>Criar novo curso</Text>
          <Text style={styles.subtitle}>Preencha os dados pedagógicos para publicar no catálogo.</Text>

          <AppInput label="Título" value={props.title} onChangeText={props.setTitle} testID="teacher-title" />
          <AppInput
            label="Categoria"
            value={props.category}
            onChangeText={props.setCategory}
            testID="teacher-category"
          />
          <AppInput
            label="Descrição"
            value={props.description}
            onChangeText={props.setDescription}
            testID="teacher-description"
          />
          <AppInput
            label="Descrição pedagógica"
            value={props.pedagogyDescription}
            onChangeText={props.setPedagogyDescription}
            testID="teacher-pedagogy"
          />
          <View style={styles.rowInputs}>
            <AppInput
              label="Aulas"
              keyboardType="numeric"
              value={props.lessonsCount}
              onChangeText={props.setLessonsCount}
              testID="teacher-lessons"
            />
            <AppInput
              label="Horas"
              keyboardType="numeric"
              value={props.estimatedHours}
              onChangeText={props.setEstimatedHours}
              testID="teacher-hours"
            />
          </View>

          <Text style={styles.levelLabel}>Nível</Text>
          <View style={styles.levelsRow}>
            {levels.map((item) => (
              <AppButton
                key={item}
                label={item === "beginner" ? "Iniciante" : item === "intermediate" ? "Intermediário" : "Avançado"}
                variant={props.level === item ? "primary" : "outline"}
                onPress={() => props.setLevel(item)}
                style={styles.levelButton}
                testID={`teacher-level-${item}`}
              />
            ))}
          </View>

          <AppButton
            label="Publicar curso"
            onPress={props.onCreateCourse}
            loading={props.loading}
            testID="teacher-submit"
          />
        </View>
      }
      renderItem={({ item }) => <CourseCard course={item} onPress={() => props.onOpenCourse(item)} />}
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não criou cursos.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.xxl,
  },
  formCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  title: {
    color: theme.colors.textMain,
    fontSize: theme.typography.h2,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
  },
  rowInputs: {
    gap: theme.spacing.s,
  },
  levelLabel: {
    marginBottom: theme.spacing.s,
    color: theme.colors.textMain,
    fontWeight: "600",
    fontSize: theme.typography.small,
  },
  levelsRow: {
    flexDirection: "row",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
    flexWrap: "wrap",
  },
  levelButton: {
    minWidth: 100,
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    marginTop: theme.spacing.l,
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    gap: theme.spacing.s,
  },
  lockedTitle: {
    fontSize: theme.typography.h2,
    color: theme.colors.textMain,
    fontWeight: "700",
  },
  lockedText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
  },
});