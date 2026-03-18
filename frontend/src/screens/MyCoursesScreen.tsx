import { FlatList, StyleSheet, Text, View } from "react-native";
import { CourseCard } from "../components/CourseCard";
import { theme } from "../constants/theme";
import { Enrollment } from "../types";

interface MyCoursesScreenProps {
  enrollments: Enrollment[];
  onOpenCourse: (courseId: string) => void;
}

export function MyCoursesScreen({ enrollments, onOpenCourse }: MyCoursesScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus cursos</Text>
      <Text style={styles.subtitle}>Acesse rapidamente os cursos onde você já está inscrito.</Text>

      <FlatList
        data={enrollments}
        keyExtractor={(item) => item.enrollment_id}
        renderItem={({ item }) => (
          <CourseCard course={item.course} onPress={() => onOpenCourse(item.course.course_id)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Você ainda não possui inscrições ativas.</Text>}
      />
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
    marginBottom: theme.spacing.l,
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  empty: {
    marginTop: theme.spacing.xl,
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
  },
});