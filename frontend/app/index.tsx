/**
 * index.tsx — Ponto de entrada do app CursiFy.
 *
 * Integração com o backend via services (Axios):
 *   - authService    → login, registro, perfil
 *   - courseService  → catálogo, criação, exclusão
 *   - enrollmentService → inscrições do usuário
 *   - adminService   → painel administrativo
 *
 * Sessão persistida no AsyncStorage (chave: cursify_session).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { pickCourseImage } from "../src/constants/images";
import { theme } from "../src/constants/theme";
import { AdminScreen } from "../src/screens/AdminScreen";
import { AuthScreen } from "../src/screens/AuthScreen";
import { CatalogScreen } from "../src/screens/CatalogScreen";
import { CourseDetailsScreen } from "../src/screens/CourseDetailsScreen";
import { MyCoursesScreen } from "../src/screens/MyCoursesScreen";
import { ProfileScreen } from "../src/screens/ProfileScreen";
import { TeacherScreen } from "../src/screens/TeacherScreen";
import { ApiError, setAuthToken } from "../src/services/api";
import adminService from "../src/services/adminService";
import authService from "../src/services/authService";
import courseService from "../src/services/courseService";
import enrollmentService from "../src/services/enrollmentService";
import {
  AdminOverview,
  AppTab,
  Course,
  CourseLevel,
  CreateCoursePayload,
  Enrollment,
  UpdateProfilePayload,
  User,
} from "../src/types";

type AuthMode = "login" | "register";

const SESSION_KEY = "cursify_session";

export default function Index() {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("catalog");

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState("Desenvolvimento");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCoursePedagogy, setNewCoursePedagogy] = useState("");
  const [newCourseLessons, setNewCourseLessons] = useState("8");
  const [newCourseHours, setNewCourseHours] = useState("4");
  const [newCourseLevel, setNewCourseLevel] = useState<CourseLevel>("beginner");

  const [busy, setBusy] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  // ─── Restaura sessão salva ao abrir o app ──────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) { setScreenLoading(false); return; }
      try {
        const { token: savedToken, user: savedUser } = JSON.parse(raw) as { token: string; user: User };
        setToken(savedToken);
        setUser(savedUser);
        setAuthToken(savedToken);
        loadInitialData(savedUser).finally(() => setScreenLoading(false));
      } catch {
        setScreenLoading(false);
      }
    });
  }, []);

  // ─── Animação de transição entre abas ─────────────────────────────────────
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: useNative }).start(() =>
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: useNative }).start()
    );
  }, [activeTab, selectedCourse, fadeAnim]);

  // ─── Abas dinâmicas por role ───────────────────────────────────────────────
  const tabs = useMemo(() => {
    if (!user) return [];
    const base: { key: AppTab; label: string; icon: "home-outline" | "book-outline" | "school-outline" | "shield-checkmark-outline" | "person-outline" }[] = [
      { key: "catalog", label: "Catálogo", icon: "home-outline" },
      { key: "my-courses", label: "Cursos", icon: "book-outline" },
    ];
    if (user.role === "teacher" || user.role === "admin")
      base.push({ key: "teacher", label: "Professor", icon: "school-outline" });
    if (user.role === "admin")
      base.push({ key: "admin", label: "Admin", icon: "shield-checkmark-outline" });
    base.push({ key: "profile", label: "Perfil", icon: "person-outline" });
    return base;
  }, [user]);

  // ─── Carrega dados iniciais após login/restauração ─────────────────────────
  const loadInitialData = async (nextUser: User) => {
    setScreenLoading(true);
    try {
      const [catalog, enrollments, teacher, admin] = await Promise.all([
        courseService.getAll(),
        enrollmentService.getAll(),
        nextUser.role === "teacher" || nextUser.role === "admin"
          ? courseService.getProfessorCourses()
          : Promise.resolve([] as Course[]),
        nextUser.role === "admin"
          ? adminService.getAll()
          : Promise.resolve(null as AdminOverview | null),
      ]);
      setCourses(catalog);
      setMyEnrollments(enrollments);
      setTeacherCourses(teacher);
      setAdminOverview(admin);
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  // ─── Tratamento global de erros ───────────────────────────────────────────
  const handleError = (error: unknown) => {
    if (error instanceof ApiError || error instanceof Error) {
      setFeedback(error.message);
    } else {
      setFeedback("Não foi possível concluir a ação. Tente novamente.");
    }
  };

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (email?: string, password?: string) => {
    const emailToUse = email ?? loginEmail.trim();
    const passwordToUse = password ?? loginPassword;
    setBusy(true);
    setFeedback("");
    try {
      const response = await authService.login({ email: emailToUse, password: passwordToUse });
      setToken(response.access_token);
      setUser(response.user);
      setAuthToken(response.access_token);
      setActiveTab("catalog");
      const sessionUser = {
        user_id: response.user.user_id,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        bio: response.user.bio,
        profile_image_base64: response.user.profile_image_base64,
        created_at: response.user.created_at,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: response.access_token, user: sessionUser }));
      await loadInitialData(response.user);
      setFeedback(`Bem-vindo, ${response.user.username}!`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Cursos ────────────────────────────────────────────────────────────────
  const handleRefreshCatalog = async () => {
    setScreenLoading(true);
    try {
      setCourses(await courseService.getAll());
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleOpenCourseById = async (courseId: string) => {
    try {
      setSelectedCourse(await courseService.getById(courseId));
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCourse = (course: Course) => handleOpenCourseById(course.course_id);

  const handleCreateCourse = async () => {
    if (!user) return;
    const payload: CreateCoursePayload = {
      title: newCourseTitle.trim(),
      category: newCourseCategory.trim(),
      description: newCourseDescription.trim(),
      pedagogy_description: newCoursePedagogy.trim(),
      lessons_count: Number(newCourseLessons),
      estimated_hours: Number(newCourseHours),
      level: newCourseLevel,
      thumbnail_base64: pickCourseImage(newCourseCategory, newCourseTitle),
    };
    setBusy(true);
    setFeedback("");
    try {
      await courseService.create(payload);
      setFeedback("Curso publicado com sucesso.");
      setNewCourseTitle(""); setNewCourseCategory("Desenvolvimento");
      setNewCourseDescription(""); setNewCoursePedagogy("");
      setNewCourseLessons("8"); setNewCourseHours("4");
      setNewCourseLevel("beginner");
      await loadInitialData(user);
      setActiveTab("catalog");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;
    setBusy(true);
    setFeedback("");
    try {
      await courseService.remove(courseId);
      setFeedback("Curso excluído com sucesso.");
      await loadInitialData(user);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Inscrição ─────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!selectedCourse || !user) return;
    setBusy(true);
    setFeedback("");
    try {
      await enrollmentService.create(selectedCourse.course_id);
      setFeedback("Inscrição confirmada com sucesso!");
      await loadInitialData(user);
      setSelectedCourse(await courseService.getById(selectedCourse.course_id));
      setActiveTab("my-courses");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Perfil ────────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    if (!token) return;
    setBusy(true);
    setFeedback("");
    try {
      const updated = await authService.update(payload);
      setUser(updated);
      const updatedUser = {
        user_id: updated.user_id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        bio: updated.bio,
        profile_image_base64: updated.profile_image_base64,
        created_at: updated.created_at,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: updatedUser }));
      setAuthToken(token);
      setFeedback("Perfil atualizado com sucesso.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setToken(""); setUser(null); setCourses([]); setSelectedCourse(null);
    setMyEnrollments([]); setTeacherCourses([]); setAdminOverview(null);
    setFeedback("Sessão encerrada com segurança.");
    setAuthMode("login");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderMainArea = () => {
    if (!user) return null;

    if (selectedCourse)
      return (
        <CourseDetailsScreen
          course={selectedCourse}
          canEnroll={user.role === "student" || user.role === "admin"}
          loading={busy}
          onBack={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      );

    if (activeTab === "catalog")
      return (
        <CatalogScreen
          courses={courses}
          loading={screenLoading}
          onOpenCourse={handleOpenCourse}
          onRefresh={handleRefreshCatalog}
        />
      );

    if (activeTab === "my-courses")
      return <MyCoursesScreen enrollments={myEnrollments} onOpenCourse={handleOpenCourseById} />;

    if (activeTab === "teacher")
      return (
        <TeacherScreen
          canManage={user.role === "teacher" || user.role === "admin"}
          title={newCourseTitle} setTitle={setNewCourseTitle}
          category={newCourseCategory} setCategory={setNewCourseCategory}
          description={newCourseDescription} setDescription={setNewCourseDescription}
          pedagogyDescription={newCoursePedagogy} setPedagogyDescription={setNewCoursePedagogy}
          lessonsCount={newCourseLessons} setLessonsCount={setNewCourseLessons}
          estimatedHours={newCourseHours} setEstimatedHours={setNewCourseHours}
          level={newCourseLevel} setLevel={setNewCourseLevel}
          loading={busy}
          onCreateCourse={handleCreateCourse}
          courses={teacherCourses}
          onOpenCourse={handleOpenCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      );

    if (activeTab === "admin")
      return <AdminScreen isAdmin={user.role === "admin"} data={adminOverview} />;

    return (
      <ProfileScreen
        user={user}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        loading={busy}
        feedback={feedback}
      />
    );
  };

  // Tela de loading inicial (restauração de sessão)
  if (screenLoading && !user)
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {!token || !user ? (
        <AuthScreen
          mode={authMode} setMode={setAuthMode}
          loginEmail={loginEmail} setLoginEmail={setLoginEmail}
          loginPassword={loginPassword} setLoginPassword={setLoginPassword}
          onLogin={handleLogin}
          onLoginWithCredentials={(email, password) => handleLogin(email, password)}
          loading={busy} feedback={feedback}
        />
      ) : (
        <View style={styles.flex}>
          <View style={styles.header}>
            <Text style={styles.appName}>CursiFy</Text>
            <Text style={styles.userHint}>{user.username} • {user.role}</Text>
          </View>

          {screenLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={styles.loadingText}>Sincronizando dados...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
              {renderMainArea()}
            </Animated.View>
          )}

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          {!selectedCourse && (
            <BottomTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appName: { fontSize: 28, fontWeight: "800", color: theme.colors.textMain },
  userHint: { marginTop: theme.spacing.s, color: theme.colors.textMuted, fontSize: theme.typography.small },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.m },
  loadingText: { color: theme.colors.textMuted, fontSize: theme.typography.body },
  feedback: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    backgroundColor: "#EEF2FF",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
});
