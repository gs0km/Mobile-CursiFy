import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { CourseCard } from "../components/CourseCard";
import { theme } from "../constants/theme";
import { Course } from "../types";

interface CatalogScreenProps {
  courses: Course[];
  loading: boolean;
  onOpenCourse: (course: Course) => void;
  onRefresh: () => void;
}

export function CatalogScreen({ courses, loading, onOpenCourse, onRefresh }: CatalogScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo de cursos</Text>
      <Text style={styles.subtitle}>Escolha um curso e veja todos os detalhes antes da inscrição.</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.course_id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        renderItem={({ item }) => <CourseCard course={item} onPress={() => onOpenCourse(item)} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Ainda não há cursos cadastrados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    backgroundColor: theme.colors.background,
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
    textAlign: "left",
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.body,
  },
});