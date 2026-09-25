import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../components/AppButton";
import { pickCourseImage } from "../constants/images";
import { useTheme } from "../contexts/ThemeContext";
import courseService from "../services/courseService";
import { Course, CourseExercise, CourseMaterial, CourseRating } from "../types";

interface CourseDetailsScreenProps {
  course: Course;
  canEnroll: boolean;
  enrolled?: boolean;
  loading: boolean;
  userId: string;
  onBack: () => void;
  onEnroll: () => void;
}

const CATEGORIAS: Record<string, string> = {
  FUNDAMENTAL_1: "Fundamental 1 (1o ao 5o ano)",
  FUNDAMENTAL_2: "Fundamental 2 (6o ao 9o ano)",
  MEDIO_1: "Ensino Medio - 1o ano",
  MEDIO_2: "Ensino Medio - 2o ano",
  MEDIO_3: "Ensino Medio - 3o ano",
  OUTROS: "Outros",
};

export function CourseDetailsScreen({ course, canEnroll, enrolled = false, loading, userId, onBack, onEnroll }: CourseDetailsScreenProps) {
  const { theme } = useTheme();
  const imageUri = course.thumbnail_base64 || pickCourseImage(course.category, course.title);
  const [materiais, setMateriais] = useState<CourseMaterial[]>([]);
  const [exercicios, setExercicios] = useState<CourseExercise[]>([]);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [resultados, setResultados] = useState<Record<number, boolean>>({});
  const [progresso, setProgresso] = useState(Number(course.progresso) || 0);
  const [loadingContent, setLoadingContent] = useState(true);
  const [rating, setRating] = useState<CourseRating>({ average: 0, count: 0, userRating: 0 });

  useEffect(() => {
    courseService.getContentByCourse(course.course_id)
      .then((items) => setMateriais([...new Map(items.map((item) => [item.id ?? `${item.titulo}|${item.conteudo}`, item])).values()]))
      .catch(() => setMateriais([]))
      .finally(() => setLoadingContent(false));
    courseService.getExercisesByCourse(course.course_id).then((items) => setExercicios([...new Map(items.map((item) => [item.id ?? `${item.titulo}|${item.enunciado}`, item])).values()])).catch(() => setExercicios([]));
    courseService.getProgress(userId, course.course_id).then((value) => setProgresso(Math.max(0, Math.min(100, Number(value.progresso) || 0)))).catch(() => setProgresso(0));
    courseService.getRating(userId, course.course_id).then(setRating);
  }, [course.course_id, userId]);

  const handleRate = async (star: number) => {
    const result = await courseService.rateCourse(userId, course.course_id, star);
    setRating(result);
  };

  const updatedAt = course.created_at ? new Date(course.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xxl }}
    >
      <Image source={{ uri: imageUri }} style={[styles.hero, { borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceHighlight, marginBottom: theme.spacing.m }]} />

      <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: theme.typography.small }}>
        {CATEGORIAS[course.category] ?? course.category}
      </Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMain, fontSize: theme.typography.h2, fontWeight: "800" }}>{course.title}</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small }}>Professor: {course.teacher_name}</Text>
      <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small }}>
        {course.carga_horaria}h de carga horária
      </Text>
      {updatedAt && (
        <Text style={{ marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small }}>
          🗓 Última atualização: {updatedAt}
        </Text>
      )}

      <View style={{ marginTop: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontWeight: "700", color: theme.colors.textMain, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>Avalie este curso</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => handleRate(s)} hitSlop={6}>
              <Ionicons name={s <= (rating.userRating || Math.round(rating.average)) ? "star" : "star-outline"} size={28} color="#F59E0B" />
            </Pressable>
          ))}
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginLeft: 8 }}>
            {rating.average > 0 ? `${rating.average.toFixed(1)} (${rating.count} avaliações)` : "Sem avaliações"}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontWeight: "700", color: theme.colors.textMain }}>Progresso: {progresso}%</Text>
        <View style={{ height: 8, backgroundColor: theme.colors.border, borderRadius: 8, marginTop: 8 }}><View style={{ width: `${progresso}%`, height: 8, backgroundColor: theme.colors.primary, borderRadius: 8 }} /></View>
      </View>

      <View style={{ display: "none", marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Exercícios ({exercicios.length})</Text>
        {exercicios.map((exercicio) => <View key={exercicio.id} style={{ marginBottom: theme.spacing.m }}><Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{exercicio.enunciado || exercicio.titulo}</Text>{exercicio.alternativas.map((alternativa, index) => <Pressable key={index} disabled={resultados[exercicio.id] !== undefined} onPress={() => setRespostas((current) => ({ ...current, [exercicio.id]: index }))} style={{ padding: 10, marginTop: 6, borderWidth: 1, borderColor: respostas[exercicio.id] === index ? theme.colors.primary : theme.colors.border, borderRadius: 8 }}><Text style={{ color: theme.colors.textMain }}>{String.fromCharCode(65 + index)}) {alternativa}</Text></Pressable>)}<AppButton label="Enviar resposta" disabled={respostas[exercicio.id] === undefined || resultados[exercicio.id] !== undefined} onPress={async () => { const selected = respostas[exercicio.id]; const answer = exercicio.alternativas[selected]; const correct = answer?.trim().toLowerCase() === exercicio.respostaCorreta.trim().toLowerCase() || String(selected) === exercicio.respostaCorreta; setResultados((current) => ({ ...current, [exercicio.id]: correct })); const total = materiais.length + exercicios.length; if (total) { const next = Math.min(100, progresso + Math.round(100 / total)); setProgresso(next); await courseService.saveProgress(userId, course.course_id, next); } }} /><Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{resultados[exercicio.id] === undefined ? "" : resultados[exercicio.id] ? "Resposta correta!" : "Resposta incorreta."}</Text></View>)}
        {!exercicios.length ? <Text style={{ color: theme.colors.textMuted }}>Nenhum exercício disponível.</Text> : null}
      </View>

      <View style={{ marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Descrição do curso</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, lineHeight: 24 }}>{course.description}</Text>
      </View>

      <View style={{ marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>
          📚 Materiais ({materiais.length})
        </Text>
        {loadingContent ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : materiais.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>Nenhum material disponível.</Text>
        ) : (
          materiais.map((mat) => (
            <View key={mat.id} style={{ marginBottom: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.m }}>
              <Text style={{ fontWeight: "700", color: theme.colors.textMain, fontSize: theme.typography.body }}>{mat.titulo}</Text>
              {mat.subtitulo ? (
                <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small, marginTop: 2 }}>{mat.subtitulo}</Text>
              ) : null}
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, lineHeight: 22, marginTop: theme.spacing.s }}>{mat.conteudo}</Text>
              {mat.link ? (
                <TouchableOpacity onPress={() => Linking.openURL(mat.link)} style={{ marginTop: theme.spacing.s }}>
                  <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small, textDecorationLine: "underline" }} numberOfLines={1}>
                    🔗 {mat.link}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={{ marginTop: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.m }}>
        <Text style={{ fontSize: theme.typography.body, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.s }}>Exercícios ({exercicios.length})</Text>
        {exercicios.map((exercicio) => <View key={exercicio.id} style={{ marginBottom: theme.spacing.m }}><Text style={{ color: theme.colors.textMain, fontWeight: "700" }}>{exercicio.enunciado || exercicio.titulo}</Text>{exercicio.alternativas.map((alternativa, index) => <Pressable key={index} disabled={resultados[exercicio.id] !== undefined} onPress={() => setRespostas((current) => ({ ...current, [exercicio.id]: index }))} style={{ padding: 10, marginTop: 6, borderWidth: 1, borderColor: respostas[exercicio.id] === index ? theme.colors.primary : theme.colors.border, borderRadius: 8 }}><Text style={{ color: theme.colors.textMain }}>{String.fromCharCode(65 + index)}) {alternativa}</Text></Pressable>)}<AppButton label="Enviar resposta" disabled={respostas[exercicio.id] === undefined || resultados[exercicio.id] !== undefined} onPress={async () => { const selected = respostas[exercicio.id]; const answer = exercicio.alternativas[selected]; const correct = answer?.trim().toLowerCase() === exercicio.respostaCorreta.trim().toLowerCase() || String(selected) === exercicio.respostaCorreta; setResultados((current) => ({ ...current, [exercicio.id]: correct })); const total = materiais.length + exercicios.length; if (total) { const next = Math.min(100, progresso + Math.round(100 / total)); setProgresso(next); await courseService.saveProgress(userId, course.course_id, next); } }} /><Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{resultados[exercicio.id] === undefined ? "" : resultados[exercicio.id] ? "Resposta correta!" : "Resposta incorreta."}</Text></View>)}
        {!exercicios.length ? <Text style={{ color: theme.colors.textMuted }}>Nenhum exercício disponível.</Text> : null}
      </View>

      <View style={[styles.actions, { marginTop: theme.spacing.l, gap: theme.spacing.s }]}> 
        <AppButton label="Voltar" variant="secondary" onPress={onBack} style={styles.half} testID="course-back" />
        {canEnroll && !enrolled && <AppButton label="Inscrever-se" onPress={onEnroll} loading={loading} style={styles.half} testID="course-enroll" />}
        {enrolled && <AppButton label="Já inscrito" disabled onPress={() => undefined} style={styles.half} testID="course-enrolled" />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: "100%", height: 210 },
  actions: { flexDirection: "row" },
  half: { flex: 1 },
});
