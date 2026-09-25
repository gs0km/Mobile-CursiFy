import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CourseCard } from "../components/CourseCard";
import { useTheme } from "../contexts/ThemeContext";
import courseService from "../services/courseService";
import { Course } from "../types";

interface CatalogScreenProps {
  courses: Course[];
  loading: boolean;
  userId: string;
  onOpenCourse: (course: Course) => void;
  onRefresh: () => void;
  userName?: string;
  enrolledCount?: number;
  completedCount?: number;
}

export function CatalogScreen({ courses, loading, userId, onOpenCourse, onRefresh, userName = "Aluno", enrolledCount = 0, completedCount = 0 }: CatalogScreenProps) {
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    courseService.getFavorites(userId).then(setFavorites);
    Promise.all(courses.map((c) => courseService.getRating(userId, c.course_id))).then((results) => {
      const map: Record<string, { average: number; count: number }> = {};
      courses.forEach((c, i) => { map[c.course_id] = { average: results[i].average, count: results[i].count }; });
      setRatings(map);
    });
  }, [userId, courses]);

  const handleToggleFavorite = async (courseId: string) => {
    await courseService.toggleFavorite(userId, courseId);
    setFavorites((prev) => prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]);
  };
  const visibleCourses = courses.filter((course) => `${course.title} ${course.description} ${course.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  const hasSearch = search.trim().length > 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl }}
    >
      <TextInput value={search} onChangeText={setSearch} placeholder="Buscar cursos..." placeholderTextColor={theme.colors.textMuted} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: theme.colors.textMain, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.l }} />
      {!hasSearch && <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 20, padding: theme.spacing.l, marginBottom: theme.spacing.l }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: theme.typography.small }}>ÁREA DO ALUNO</Text>
        <Text style={{ color: theme.colors.textMain, fontSize: 26, fontWeight: "800", marginTop: 6 }}>Bem-vindo, {userName}! 👋</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, marginTop: 8, lineHeight: 21 }}>Acompanhe seus estudos, encontre novos cursos e converse com professores em um único lugar.</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: theme.spacing.l }}>
          <View style={{ flex: 1, backgroundColor: theme.colors.surfaceHighlight, borderRadius: 14, padding: 12 }}><Text style={{ color: theme.colors.textMain, fontSize: 22, fontWeight: "800" }}>{enrolledCount}</Text><Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>cursos ativos</Text></View>
          <View style={{ flex: 1, backgroundColor: theme.colors.surfaceHighlight, borderRadius: 14, padding: 12 }}><Text style={{ color: theme.colors.textMain, fontSize: 22, fontWeight: "800" }}>{completedCount}</Text><Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>concluídos</Text></View>
        </View>
      </View>}
      <Text style={{ display: "none" }} />
      <Text style={{ display: "none" }} />

      {hasSearch && visibleCourses.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xl, fontSize: theme.typography.body }}>
          Ainda não há cursos cadastrados.
        </Text>
      ) : (
        visibleCourses.map((item) => (
          <CourseCard
            key={item.course_id}
            course={item}
            onPress={() => onOpenCourse(item)}
            isFavorite={favorites.includes(item.course_id)}
            onToggleFavorite={() => handleToggleFavorite(item.course_id)}
            rating={ratings[item.course_id]?.average ?? 0}
            ratingCount={ratings[item.course_id]?.count ?? 0}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
