import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { pickCourseImage } from "../constants/images";
import { theme } from "../constants/theme";
import { Course } from "../types";

interface CourseDetailsScreenProps {
  course: Course;
  canEnroll: boolean;
  loading: boolean;
  onBack: () => void;
  onEnroll: () => void;
}

export function CourseDetailsScreen({
  course,
  canEnroll,
  loading,
  onBack,
  onEnroll,
}: CourseDetailsScreenProps) {
  const imageUri = course.thumbnail_base64 || pickCourseImage(course.category, course.title);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: imageUri }} style={styles.hero} />
      <Text style={styles.category}>{course.category}</Text>
      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.meta}>Professor: {course.teacher_name}</Text>
      <Text style={styles.meta}>
        {course.lessons_count} aulas • {course.estimated_hours}h • Nível {course.level}
      </Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Descrição do curso</Text>
        <Text style={styles.blockText}>{course.description}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Descrição pedagógica</Text>
        <Text style={styles.blockText}>{course.pedagogy_description}</Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Voltar" variant="secondary" onPress={onBack} style={styles.half} testID="course-back" />
        {canEnroll ? (
          <AppButton
            label="Inscrever-se"
            onPress={onEnroll}
            loading={loading}
            style={styles.half}
            testID="course-enroll"
          />
        ) : null}
      </View>
    </ScrollView>
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
  hero: {
    width: "100%",
    height: 210,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceHighlight,
    marginBottom: theme.spacing.m,
  },
  category: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: theme.typography.small,
  },
  title: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMain,
    fontSize: theme.typography.h2,
    fontWeight: "800",
  },
  meta: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
  block: {
    marginTop: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.m,
  },
  blockTitle: {
    fontSize: theme.typography.body,
    fontWeight: "700",
    color: theme.colors.textMain,
    marginBottom: theme.spacing.s,
  },
  blockText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    marginTop: theme.spacing.l,
    flexDirection: "row",
    gap: theme.spacing.s,
  },
  half: {
    flex: 1,
  },
});