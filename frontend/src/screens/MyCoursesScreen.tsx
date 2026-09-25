import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CourseCard } from "../components/CourseCard";
import { AppButton } from "../components/AppButton";
import { useTheme } from "../contexts/ThemeContext";
import enrollmentService from "../services/enrollmentService";
import courseService from "../services/courseService";
import { Course, CourseCompletion, Enrollment } from "../types";

interface MyCoursesScreenProps {
  enrollments: Enrollment[];
  userId: string;
  onOpenCourse: (courseId: string) => void;
}

export function MyCoursesScreen({ enrollments, userId, onOpenCourse }: MyCoursesScreenProps) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<"courses" | "favorites">("courses");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completions, setCompletions] = useState<Record<string, CourseCompletion>>({});
  const [modalCourseId, setModalCourseId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [favoriteCourses, setFavoriteCourses] = useState<Course[]>([]);
  const [favRatings, setFavRatings] = useState<Record<string, { average: number; count: number }>>({});

  useEffect(() => {
    enrollmentService.getAllCompletions(userId).then(setCompletions);
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    const ids = await courseService.getFavorites(userId);
    if (ids.length === 0) { setFavoriteCourses([]); return; }
    const all = await courseService.getAll();
    const favs = all.filter((c) => ids.includes(c.course_id));
    setFavoriteCourses(favs);
    const results = await Promise.all(favs.map((c) => courseService.getRating(userId, c.course_id)));
    const map: Record<string, { average: number; count: number }> = {};
    favs.forEach((c, i) => { map[c.course_id] = { average: results[i].average, count: results[i].count }; });
    setFavRatings(map);
  };

  const handleToggleFavorite = async (courseId: string) => {
    await courseService.toggleFavorite(userId, courseId);
    await loadFavorites();
  };

  const handleFinish = async () => {
    if (!modalCourseId || rating === 0) return;
    setSaving(true);
    await enrollmentService.completeCourse(userId, modalCourseId, rating, feedback.trim());
    const updated = await enrollmentService.getAllCompletions(userId);
    setCompletions(updated);
    setSaving(false);
    setModalCourseId(null);
    setRating(0);
    setFeedback("");
  };

  const openModal = (courseId: string) => {
    const existing = completions[courseId];
    setRating(existing?.rating ?? 0);
    setFeedback(existing?.feedback ?? "");
    setModalCourseId(courseId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l }]}>
      <Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain }}>Meus cursos</Text>
      <Text style={{ marginTop: theme.spacing.s, marginBottom: theme.spacing.m, fontSize: theme.typography.body, color: theme.colors.textMuted }}>
        Acesse rapidamente os cursos onde você já está inscrito.
      </Text>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => setTab("courses")} style={[styles.tab, { borderBottomColor: tab === "courses" ? theme.colors.primary : "transparent" }]}>
          <Ionicons name="book-outline" size={15} color={tab === "courses" ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: tab === "courses" ? theme.colors.primary : theme.colors.textMuted, marginLeft: 5 }}>
            Inscritos ({enrollments.length})
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab("favorites")} style={[styles.tab, { borderBottomColor: tab === "favorites" ? "#EF4444" : "transparent" }]}>
          <Ionicons name="heart" size={15} color={tab === "favorites" ? "#EF4444" : theme.colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: tab === "favorites" ? "#EF4444" : theme.colors.textMuted, marginLeft: 5 }}>
            Favoritos ({favoriteCourses.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }} showsVerticalScrollIndicator={false}>

        {/* Aba Favoritos */}
        {tab === "favorites" && (
          favoriteCourses.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: theme.spacing.xxl }}>
              <Ionicons name="heart-outline" size={48} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, marginTop: theme.spacing.m, textAlign: "center" }}>
                {"Você ainda não favoritou nenhum curso.\nExplore o catálogo e favorite os que te interessam!"}
              </Text>
            </View>
          ) : (
            favoriteCourses.map((item) => (
              <CourseCard
                key={item.course_id}
                course={item}
                onPress={() => onOpenCourse(item.course_id)}
                isFavorite
                onToggleFavorite={() => handleToggleFavorite(item.course_id)}
                rating={favRatings[item.course_id]?.average ?? 0}
                ratingCount={favRatings[item.course_id]?.count ?? 0}
              />
            ))
          )
        )}

        {/* Aba Inscritos */}
        {tab === "courses" && (
          enrollments.length === 0 ? (
            <Text style={{ marginTop: theme.spacing.xl, color: theme.colors.textMuted, fontSize: theme.typography.body }}>
              Você ainda não possui inscrições ativas.
            </Text>
          ) : (
            enrollments.map((item) => {
              const isOpen = expanded === item.enrollment_id;
              const hasLinks = (item.course.video_links?.length > 0) || (item.course.site_links?.length > 0);
              const completion = completions[item.course.course_id];
              const isDone = completion?.completed;
              const statusColor = isDone ? "#10B981" : "#F59E0B";
              const statusIcon: any = isDone ? "checkmark-circle" : "time-outline";

              return (
                <View key={item.enrollment_id} style={{ marginBottom: theme.spacing.s }}>
                  <View>
                    <CourseCard course={item.course} onPress={() => onOpenCourse(item.course.course_id)} />
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Ionicons name={statusIcon} size={13} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", marginLeft: 4 }}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: theme.colors.border, borderBottomLeftRadius: theme.radius.md, borderBottomRightRadius: theme.radius.md, overflow: "hidden" }}>
                    {hasLinks && (
                      <TouchableOpacity
                        onPress={() => setExpanded(isOpen ? null : item.enrollment_id)}
                        style={{ flex: 1, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, backgroundColor: theme.colors.surface }}
                      >
                        <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: theme.typography.small }}>
                          {isOpen ? "▲ Ocultar links" : "▼ Ver links de estudo"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isOpen && (
                    <View style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderTopWidth: 0, borderColor: theme.colors.border, borderBottomLeftRadius: theme.radius.md, borderBottomRightRadius: theme.radius.md, padding: theme.spacing.m }}>
                      {item.course.video_links?.map((link, i) => (
                        <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
                          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small, textDecorationLine: "underline", marginBottom: 4 }} numberOfLines={1}>🎬 {link}</Text>
                        </TouchableOpacity>
                      ))}
                      {item.course.site_links?.map((link, i) => (
                        <TouchableOpacity key={i} onPress={() => Linking.openURL(link)}>
                          <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small, textDecorationLine: "underline", marginBottom: 4 }} numberOfLines={1}>🌐 {link}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )
        )}
      </ScrollView>

      <Modal visible={modalCourseId !== null} transparent animationType="fade" onRequestClose={() => setModalCourseId(null)}>
        <Pressable style={styles.overlay} onPress={() => setModalCourseId(null)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {completions[modalCourseId ?? ""]?.completed ? (
                <>
                  <View style={{ alignItems: "center", marginBottom: theme.spacing.m }}>
                    <Ionicons name="ribbon" size={48} color="#10B981" />
                    <Text style={{ fontSize: theme.typography.h2, fontWeight: "800", color: theme.colors.textMain, marginTop: theme.spacing.s }}>Curso concluído! 🎉</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginTop: 4 }}>
                      {new Date(completions[modalCourseId ?? ""].completedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Sua avaliação</Text>
                  <View style={{ flexDirection: "row", marginBottom: theme.spacing.m }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name={s <= completions[modalCourseId ?? ""].rating ? "star" : "star-outline"} size={28} color="#F59E0B" />
                    ))}
                  </View>
                  {completions[modalCourseId ?? ""].feedback ? (
                    <>
                      <Text style={{ fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Seu feedback</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, lineHeight: 22 }}>{completions[modalCourseId ?? ""].feedback}</Text>
                    </>
                  ) : null}
                  <AppButton label="Fechar" variant="outline" onPress={() => setModalCourseId(null)} style={{ marginTop: theme.spacing.m }} />
                </>
              ) : (
                <>
                  <Text style={{ fontSize: theme.typography.h2, fontWeight: "800", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Finalizar curso</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginBottom: theme.spacing.m }}>Avalie sua experiência antes de concluir.</Text>
                  <Text style={{ fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Nota do curso *</Text>
                  <View style={{ flexDirection: "row", marginBottom: theme.spacing.m }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Pressable key={s} onPress={() => setRating(s)} hitSlop={6}>
                        <Ionicons name={s <= rating ? "star" : "star-outline"} size={36} color="#F59E0B" />
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{ fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Feedback (opcional)</Text>
                  <TextInput
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Conte o que achou do curso..."
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    numberOfLines={4}
                    style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.m, color: theme.colors.textMain, fontSize: theme.typography.body, minHeight: 100, textAlignVertical: "top", backgroundColor: theme.colors.background, marginBottom: theme.spacing.m }}
                  />
                  {rating === 0 && <Text style={{ color: theme.colors.error, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>Selecione uma nota para continuar.</Text>}
                  <AppButton label="Concluir curso" onPress={handleFinish} loading={saving} />
                  <AppButton label="Cancelar" variant="outline" onPress={() => setModalCourseId(null)} style={{ marginTop: theme.spacing.s }} />
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderBottomWidth: 2 },
  statusBadge: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 24, maxHeight: "85%" },
});
