import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { pickCourseImage } from "../constants/images";
import { theme } from "../constants/theme";
import { Course } from "../types";

interface CourseCardProps {
  course: Course;
  onPress: () => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const imageUri = course.thumbnail_base64 || pickCourseImage(course.category, course.title);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir curso ${course.title}`}
      testID={`course-card-${course.course_id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: imageUri }} style={styles.banner} />
      <View style={styles.content}>
        <Text style={styles.category}>{course.category}</Text>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.meta}>{course.teacher_name}</Text>
        <Text style={styles.meta}>
          {course.lessons_count} aulas • {course.estimated_hours}h • {course.enrolled_count} inscritos
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.m,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  banner: {
    width: "100%",
    height: 130,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  content: {
    padding: theme.spacing.m,
    gap: theme.spacing.s,
  },
  category: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    color: theme.colors.textMain,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
});